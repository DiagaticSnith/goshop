"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processOrderAddress = void 0;
const processOrderAddress = (address) => {
    const line1 = [address === null || address === void 0 ? void 0 : address.line1, address === null || address === void 0 ? void 0 : address.line2].filter(Boolean).join(", ");
    const line2 = [address === null || address === void 0 ? void 0 : address.city, address === null || address === void 0 ? void 0 : address.state].filter(Boolean).join(", ");
    const line3 = [address === null || address === void 0 ? void 0 : address.postal_code].filter(Boolean).join(", ");
    const finalAddress = [line1, line2, line3].filter(Boolean).join(", ");
    return finalAddress;
};
exports.processOrderAddress = processOrderAddress;
