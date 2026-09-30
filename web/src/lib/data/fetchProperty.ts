import { findAddress } from "./addresses";
import { fetchProperty } from "./property";
export async function getProperty(id: string) { return findAddress(id) ?? fetchProperty(id); }
