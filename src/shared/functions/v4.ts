import type {UUID} from "../UUID";
import {randomBytes} from "../randomBytes";
import {fromBytes} from "./fromBytes";

export function v4(): UUID { return fromBytes(randomBytes(4)); }
