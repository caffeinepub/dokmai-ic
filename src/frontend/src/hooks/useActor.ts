import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

// Pre-configured useActor bound to this project's backend createActor function.
// Actor is typed as `any` because backend.d.ts has an empty interface until
// bindgen regenerates it from the compiled backend.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useActor(): { actor: any | null; isFetching: boolean } {
  return _useActor((canisterId, uploadFile, downloadFile, options) =>
    createActor(canisterId, uploadFile, downloadFile, options),
  );
}
