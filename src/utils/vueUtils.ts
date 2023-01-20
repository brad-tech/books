import { onMounted, onUnmounted, reactive, ref, unref, watch } from 'vue';

interface ModMap {
  alt: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  repeat: boolean;
}

type Mod = keyof ModMap;

interface Keys extends ModMap {
  pressed: Set<string>;
}

type ShortcutFunction = () => void;

const mods: Readonly<Mod[]> = ['alt', 'ctrl', 'meta', 'repeat', 'shift'];

export class Shortcuts {
  keys: Keys;
  shortcuts: Map<string, ShortcutFunction>;
  modMap: Partial<Record<Mod, boolean>>;

  constructor(keys?: Keys) {
    this.modMap = {};
    this.keys = keys ?? useKeys();
    this.shortcuts = new Map();

    watch(this.keys, (keys) => {
      this.#trigger(keys);
    });
  }

  #trigger(keys: Keys) {
    const key = this.getKey(Array.from(keys.pressed), keys);
    this.shortcuts.get(key)?.();
  }

  has(shortcut: string[]) {
    const key = this.getKey(shortcut);
    return this.shortcuts.has(key);
  }

  set(
    shortcut: string[],
    callback: ShortcutFunction,
    removeIfSet: boolean = true
  ) {
    const key = this.getKey(shortcut);

    if (removeIfSet) {
      this.shortcuts.delete(key);
    }

    if (this.shortcuts.has(key)) {
      throw new Error(`Shortcut ${key} already exists.`);
    }

    this.shortcuts.set(key, callback);
  }

  delete(shortcut: string[]) {
    const key = this.getKey(shortcut);
    this.shortcuts.delete(key);
  }

  getKey(shortcut: string[], modMap?: Partial<ModMap>): string {
    const _modMap = modMap || this.modMap;
    this.modMap = {};

    const shortcutString = shortcut.sort().join('+');
    const modString = mods.filter((k) => _modMap[k]).join('+');
    if (shortcutString && modString) {
      return modString + '+' + shortcutString;
    }

    if (!modString) {
      return shortcutString;
    }

    if (!shortcutString) {
      return modString;
    }

    return '';
  }

  get alt() {
    this.modMap['alt'] = true;
    return this;
  }

  get ctrl() {
    this.modMap['ctrl'] = true;
    return this;
  }

  get meta() {
    this.modMap['meta'] = true;
    return this;
  }

  get shift() {
    this.modMap['shift'] = true;
    return this;
  }

  get repeat() {
    this.modMap['repeat'] = true;
    return this;
  }
}

export function useKeys() {
  const keys: Keys = reactive({
    pressed: new Set<string>(),
    alt: false,
    ctrl: false,
    meta: false,
    shift: false,
    repeat: false,
  });

  const keydownListener = (e: KeyboardEvent) => {
    keys.pressed.add(e.code);
    keys.alt = e.altKey;
    keys.ctrl = e.ctrlKey;
    keys.meta = e.metaKey;
    keys.shift = e.shiftKey;
    keys.repeat = e.repeat;
  };

  const keyupListener = (e: KeyboardEvent) => {
    keys.pressed.delete(e.code);

    // Key up won't trigger on macOS for other keys.
    if (e.code === 'MetaLeft') {
      keys.pressed.clear();
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', keydownListener);
    window.addEventListener('keyup', keyupListener);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', keydownListener);
    window.removeEventListener('keyup', keyupListener);
  });

  return keys;
}

export function useMouseLocation() {
  const loc = ref({ clientX: 0, clientY: 0 });

  const mousemoveListener = (e: MouseEvent) => {
    loc.value.clientX = e.clientX;
    loc.value.clientY = e.clientY;
  };

  onMounted(() => {
    window.addEventListener('mousemove', mousemoveListener);
  });
  onUnmounted(() => {
    window.removeEventListener('mousemove', mousemoveListener);
  });

  return loc;
}

export function getModKeyCode(platform: 'Windows' | 'Linux' | 'Mac') {
  if (platform === 'Mac') {
    return 'MetaLeft';
  }

  return 'CtrlLeft';
}
