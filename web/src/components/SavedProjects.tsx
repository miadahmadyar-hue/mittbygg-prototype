"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { listProjects, useProjectRevision } from "@/lib/projects";
import { listDocuments, downloadBlob, type SavedDocument } from "@/lib/documents";
import { TILTAK } from "@/lib/data/tiltak";
import { useT } from "@/lib/i18n/context";

export function SavedProjects({ propertyId }: { propertyId: string }) {
  const t = useT();
  const revision = useProjectRevision();
  const projects = revision < 0 ? [] : listProjects(propertyId);
  const [documents, setDocuments] = useState<SavedDocument[]>([]);
  useEffect(() => {
    let active = true;
    listDocuments(propertyId).then((docs) => { if (active) setDocuments(docs); }).catch(() => {});
    return () => { active = false; };
  }, [propertyId]);
  return <aside className="panel project-status">
    <h2 className="text-xl font-semibold">{t("Mine prosjekter", "My projects")}</h2>
    <p className="mt-2 text-xs text-gray-500">{t("Utkast og PDF-er lagres i denne nettleseren på denne enheten. Ett utkast per tiltakstype. Unngå delte enheter.", "Drafts and PDFs are saved in this browser on this device. One draft per project type. Avoid shared devices.")}</p>
    {projects.length === 0 && <p className="mt-4">{t("Ingen lagrede tiltak ennå.", "No saved projects yet.")}</p>}
    <ul className="mt-4 space-y-3">{projects.map((project) => {
      const item = TILTAK.find((entry) => entry.slug === project.slug);
      return <li key={project.path}><Link className="text-link" href={project.path}>{item ? t(item.name, item.name_en) : project.slug} →</Link><p className="text-xs text-gray-500">{project.ready ? t("Dokument generert", "Document generated") : t("Fortsett utkast", "Resume draft")}</p></li>;
    })}</ul>
    {documents.length > 0 && <><h3 className="mt-6 font-semibold">{t("Dokumenter", "Documents")}</h3><ul>{documents.map((doc) => <li key={doc.id} className="mt-3"><button className="text-link" onClick={() => downloadBlob(doc.blob, doc.filename)}>{t("Last ned", "Download")} {doc.filename}</button><p className="text-xs text-gray-500">{new Date(doc.created).toLocaleDateString("nb-NO")}</p></li>)}</ul></>}
    <Link href={`/property/${propertyId}/tiltak`} className="secondary-link mt-6">{t("Velg tiltak", "Choose project")}</Link>
  </aside>;
}
