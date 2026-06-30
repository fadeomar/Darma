export type LocalStoreOptions<TValue> = {
  key: string;
  version: number;
  fallback: TValue;
  normalise?: (value: TValue) => TValue;
};

type StoredPayload<TValue> = {
  version: number;
  value: TValue;
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export const createLocalStore = <TValue>(options: LocalStoreOptions<TValue>) => {
  const read = (): TValue => {
    if (!canUseStorage()) return options.fallback;

    try {
      const raw = window.localStorage.getItem(options.key);
      if (!raw) return options.fallback;

      const payload = JSON.parse(raw) as StoredPayload<TValue>;
      if (payload.version !== options.version) return options.fallback;

      return options.normalise ? options.normalise(payload.value) : payload.value;
    } catch {
      return options.fallback;
    }
  };

  const write = (value: TValue) => {
    if (!canUseStorage()) return;

    const normalised = options.normalise ? options.normalise(value) : value;
    window.localStorage.setItem(options.key, JSON.stringify({ version: options.version, value: normalised }));
  };

  const reset = () => {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(options.key);
  };

  return { read, write, reset };
};
