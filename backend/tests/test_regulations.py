import unittest

from models import (
    AnneksInput,
    BoenhetInput,
    BruksendringInput,
    BryggeInput,
    FasadeInput,
    GarasjeInput,
    KjellerInput,
    LevegInput,
    TakInput,
    TilbyggInput,
    VeggInput,
)
from regulations.anneks import evaluate_anneks
from regulations.boenhet import evaluate_boenhet
from regulations.bruksendring import evaluate_bruksendring
from regulations.brygge import evaluate_brygge
from regulations.fasade import evaluate_fasade
from regulations.garasje import evaluate_garasje
from regulations.kjeller import evaluate_kjeller
from regulations.levegg import evaluate_levegg
from regulations.tak import evaluate_tak
from regulations.tilbygg import evaluate_tilbygg
from regulations.vegg import evaluate_vegg


class RegulationBoundaryTests(unittest.TestCase):
    def garage(self, **changes):
        values = {
            "type": "garasje",
            "areal": 50,
            "avstand": 1,
            "avstand_bygg": 1,
            "overnatting": False,
            "kjeller": False,
            "etasjer": 1,
            "monehoyde": 4,
            "gesimshoyde": 3,
            "over_ledninger": False,
            "plan_ok": True,
        }
        values.update(changes)
        return evaluate_garasje(GarasjeInput(**values))

    def test_garage_at_50_square_metres_can_be_exempt(self):
        result = self.garage()
        self.assertEqual(result.status, "green")
        self.assertIn("Unntatt", result.soknadstype)

    def test_garage_between_50_and_70_can_be_self_applied(self):
        result = self.garage(areal=60)
        self.assertEqual(result.status, "amber")
        self.assertFalse(result.ansvarsrett)

    def test_garage_over_70_requires_responsible_firm(self):
        result = self.garage(areal=71)
        self.assertEqual(result.status, "red")
        self.assertTrue(result.ansvarsrett)

    def test_unknown_garage_plan_blocks_application_package(self):
        result = self.garage(plan_ok=None)
        self.assertIn("Må avklares", result.soknadstype)

    def test_overnight_annex_is_not_exempt_outbuilding(self):
        result = evaluate_anneks(AnneksInput(
            type="anneks", areal=30, avstand=1, avstand_bygg=1,
            overnatting=True, plan_ok=True,
        ))
        self.assertEqual(result.status, "red")
        self.assertTrue(result.ansvarsrett)

    def test_new_storey_never_uses_small_extension_exemption(self):
        result = evaluate_tilbygg(TilbyggInput(
            type="ny_etasje", areal=10, avstand=4, bruk="bod",
            plan_ok=True, bya_ok=True,
        ))
        self.assertEqual(result.status, "red")
        self.assertTrue(result.ansvarsrett)

    def test_small_storage_extension_can_be_exempt(self):
        result = evaluate_tilbygg(TilbyggInput(
            type="tilbygg_1etasje", areal=15, avstand=4, bruk="bod",
            understottet=True, en_etasje=True, egen_boenhet=False, samme_formaal=True,
            plan_ok=True, bya_ok=True,
        ))
        self.assertEqual(result.status, "green")

    def test_unknown_extension_plan_requires_clarification(self):
        result = evaluate_tilbygg(TilbyggInput(
            type="tilbygg_1etasje", areal=25, avstand=4,
            bruk="oppholdsrom", plan_ok=None, bya_ok=None,
        ))
        self.assertIn("Må avklares", result.soknadstype)

    def test_privacy_wall_length_limit_changes_at_one_metre(self):
        near = evaluate_levegg(LevegInput(hoyde=1.8, lengde=6, avstand=0.5, plan_ok=True))
        far = evaluate_levegg(LevegInput(hoyde=1.8, lengde=10, avstand=1, plan_ok=True))
        self.assertEqual(near.status, "amber")
        self.assertEqual(far.status, "green")

    def test_privacy_wall_requires_plan_confirmation(self):
        result = evaluate_levegg(LevegInput(hoyde=1.8, lengde=5, avstand=0.5))
        self.assertIn("Må avklares", result.soknadstype)

    def test_like_for_like_window_replacement_is_only_likely_exempt(self):
        result = evaluate_fasade(FasadeInput(
            type="skifte_vindu", verneverdig=False,
            samme_utseende=True, karakterendring="nei",
        ))
        self.assertEqual(result.status, "green")
        self.assertIn("Trolig", result.soknadstype)

    def test_roof_material_change_needs_clarification(self):
        unchanged = evaluate_tak(TakInput(
            type="bytte_materiale", verneverdig=False,
            etterisolere=False, samme_utseende=True,
        ))
        changed = evaluate_tak(TakInput(
            type="bytte_materiale", verneverdig=False,
            etterisolere=False, samme_utseende=False,
        ))
        self.assertEqual(unchanged.status, "green")
        self.assertEqual(changed.status, "amber")

    def test_new_dwelling_requires_all_three_criteria(self):
        complete = evaluate_boenhet(BoenhetInput(
            type="sokkelleilighet", antall=1, areal=45,
            hovedfunksjoner=True, egen_inngang=True, fysisk_adskilt=True,
        ))
        incomplete = evaluate_boenhet(BoenhetInput(
            type="sokkelleilighet", antall=1, areal=45,
            hovedfunksjoner=True, egen_inngang=True, fysisk_adskilt=False,
        ))
        self.assertTrue(complete.ansvarsrett)
        self.assertFalse(incomplete.ansvarsrett)

    def test_wall_flow_never_returns_beam_sizing(self):
        result = evaluate_vegg(VeggInput(
            type="fjerne_vegg", baerende="ja", apning_bredde=3,
            etasje="forste", etasjer_over=1, konstruksjon="tre",
        ))
        self.assertIsNone(result.bjelke)
        self.assertTrue(result.ansvarsrett)

    def test_unresolved_basement_evidence_blocks_ready_state(self):
        result = evaluate_kjeller(KjellerInput(
            propId="1", byggeAar=1985, room="bod", ny_bruk="soverom",
            radon=50, drenering=True, balansert_vent=True,
            rom_areal=20, takhoyde=2300,
            vindu_bredde=0.8, vindu_hoyde=0.8, vindu_brystning=1,
            godkjent_bruk_bekreftet=True,
            drenering_status="ja", ventilasjon_status="ja",
        ))
        self.assertEqual(result.status, "amber")
        self.assertIn("Må avklares", result.soknadstype)

    def test_waterfront_plan_conflict_requires_dispensation(self):
        result = evaluate_brygge(BryggeInput(
            type="fast", lengde=6, bredde=2, arbeid="ny",
            eier_strandgrunn=True, plan_status="ikke_tillatt",
        ))
        self.assertEqual(result.status, "red")
        self.assertIn("Må avklares", result.soknadstype)

    def test_structural_change_of_use_requires_professional(self):
        result = evaluate_bruksendring(BruksendringInput(
            fra="bod", til="bolig", areal=30, verneverdig=False,
            godkjent_bruk_bekreftet=True, plan_status="tillatt",
            inngrep_baerende=True,
        ))
        self.assertEqual(result.status, "red")
        self.assertTrue(result.ansvarsrett)


if __name__ == "__main__":
    unittest.main()
