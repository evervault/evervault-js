import { ThreeDS } from "./context";
import { ThreeDSFrame } from "./ThreeDSFrame";

const ThreeDSNamespace = Object.assign(ThreeDS, {
    Frame: ThreeDSFrame
});

export { useThreeDS } from "./context";
export { ThreeDSNamespace as ThreeDS };