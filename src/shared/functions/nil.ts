import type {UUID} from "../UUID";
import {NIL_UUID} from "../constants";
import {parseUuid} from "./parseUuid";

export function nil(): UUID { return parseUuid(NIL_UUID); }
