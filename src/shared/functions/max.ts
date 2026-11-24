import type {UUID} from "../UUID";
import {MAX_UUID} from "../constants";
import {parseUuid} from "./parseUuid";

export function max(): UUID { return parseUuid(MAX_UUID); }
