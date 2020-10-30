"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const chalk_1 = __importDefault(require("chalk"));
const chalk_presets_1 = require("./utils/chalk-presets");
exports.config = Object.assign({}, {
    handlers: ['load-env', 'start-webhook'],
    utils: ['chalk-presets']
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    const handlers = exports.config.handlers;
    for (let i = 0; i < handlers.length; i++) {
        const handler = handlers[i];
        try {
            yield require(`./handlers/${handler}`);
        }
        catch (err) {
            console.error(err);
            console.error(`${chalk_presets_1.chalkPresets.error('Failed')} loading handler ${chalk_1.default.bold(handler)}`);
        }
    }
}))();
