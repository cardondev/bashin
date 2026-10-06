import type { PaletteSource } from './palette-types';

/**
 * Non-Catppuccin palettes. Colors from the official sources linked per entry.
 *
 * - `terminal` comes from the theme's official terminal port (the `source` URL).
 *   Two themes have no official terminal port and use mbadolato/iTerm2-Color-Schemes
 *   instead (One Dark, Monokai); their `source` says so.
 * - `accents` maps Catppuccin's 14 accent slots to the closest-hue color of the
 *   theme's own named palette (colors are reused when the theme has fewer hues).
 * - `neutrals` lists only slots with a clear official equivalent; the rest are
 *   interpolated by `resolvePalette`.
 */
export const EXTRA_PALETTES: PaletteSource[] = [
  // ── Rosé Pine ──────────────────────────────────────────────────────────────
  // Named palette (accents/neutrals): https://rosepinetheme.com/palette/
  // love #eb6f92 · gold #f6c177 · rose #ebbcba · pine #31748f · foam #9ccfd8 · iris #c4a7e7
  {
    id: 'rose-pine',
    name: 'Rosé Pine',
    family: 'Rosé Pine',
    dark: true,
    source: 'https://github.com/rose-pine/alacritty/blob/main/dist/rose-pine.toml',
    terminal: {
      background: '#191724',
      foreground: '#e0def4',
      cursor: '#524f67',
      selection: '#403d52',
      ansi: [
        '#26233a', '#eb6f92', '#31748f', '#f6c177', '#9ccfd8', '#c4a7e7', '#ebbcba', '#e0def4',
        '#6e6a86', '#eb6f92', '#31748f', '#f6c177', '#9ccfd8', '#c4a7e7', '#ebbcba', '#e0def4',
      ],
    },
    accents: {
      rosewater: '#ebbcba', // rose
      flamingo: '#ebbcba', // rose
      pink: '#eb6f92', // love
      mauve: '#c4a7e7', // iris
      red: '#eb6f92', // love
      maroon: '#ebbcba', // rose
      peach: '#f6c177', // gold
      yellow: '#f6c177', // gold
      green: '#9ccfd8', // foam (Rosé Pine's color for git additions)
      teal: '#9ccfd8', // foam
      sky: '#9ccfd8', // foam
      sapphire: '#31748f', // pine
      blue: '#31748f', // pine
      lavender: '#c4a7e7', // iris
    },
    neutrals: {
      text: '#e0def4', // text
      overlay2: '#908caa', // subtle
      overlay0: '#6e6a86', // muted
      surface2: '#524f67', // highlight high
      surface1: '#403d52', // highlight med
      surface0: '#26233a', // overlay
      base: '#191724', // base
    },
  },
  {
    id: 'rose-pine-moon',
    name: 'Rosé Pine Moon',
    family: 'Rosé Pine',
    dark: true,
    source: 'https://github.com/rose-pine/alacritty/blob/main/dist/rose-pine-moon.toml',
    terminal: {
      background: '#232136',
      foreground: '#e0def4',
      cursor: '#56526e',
      selection: '#44415a',
      ansi: [
        '#393552', '#eb6f92', '#3e8fb0', '#f6c177', '#9ccfd8', '#c4a7e7', '#ea9a97', '#e0def4',
        '#6e6a86', '#eb6f92', '#3e8fb0', '#f6c177', '#9ccfd8', '#c4a7e7', '#ea9a97', '#e0def4',
      ],
    },
    accents: {
      rosewater: '#ea9a97', // rose
      flamingo: '#ea9a97', // rose
      pink: '#eb6f92', // love
      mauve: '#c4a7e7', // iris
      red: '#eb6f92', // love
      maroon: '#ea9a97', // rose
      peach: '#f6c177', // gold
      yellow: '#f6c177', // gold
      green: '#9ccfd8', // foam
      teal: '#9ccfd8', // foam
      sky: '#9ccfd8', // foam
      sapphire: '#3e8fb0', // pine
      blue: '#3e8fb0', // pine
      lavender: '#c4a7e7', // iris
    },
    neutrals: {
      text: '#e0def4', // text
      overlay2: '#908caa', // subtle
      overlay0: '#6e6a86', // muted
      surface2: '#56526e', // highlight high
      surface1: '#44415a', // highlight med
      surface0: '#393552', // overlay
      base: '#232136', // base
    },
  },
  {
    id: 'rose-pine-dawn',
    name: 'Rosé Pine Dawn',
    family: 'Rosé Pine',
    dark: false,
    source: 'https://github.com/rose-pine/alacritty/blob/main/dist/rose-pine-dawn.toml',
    terminal: {
      background: '#faf4ed',
      foreground: '#575279',
      cursor: '#cecacd',
      selection: '#dfdad9',
      ansi: [
        '#f2e9e1', '#b4637a', '#286983', '#ea9d34', '#56949f', '#907aa9', '#d7827e', '#575279',
        '#9893a5', '#b4637a', '#286983', '#ea9d34', '#56949f', '#907aa9', '#d7827e', '#575279',
      ],
    },
    accents: {
      rosewater: '#d7827e', // rose
      flamingo: '#d7827e', // rose
      pink: '#b4637a', // love
      mauve: '#907aa9', // iris
      red: '#b4637a', // love
      maroon: '#d7827e', // rose
      peach: '#ea9d34', // gold
      yellow: '#ea9d34', // gold
      green: '#56949f', // foam
      teal: '#56949f', // foam
      sky: '#56949f', // foam
      sapphire: '#286983', // pine
      blue: '#286983', // pine
      lavender: '#907aa9', // iris
    },
    neutrals: {
      // The current palette lists Dawn text as #464261; the terminal ports still use #575279.
      text: '#464261', // text
      overlay2: '#797593', // subtle
      overlay0: '#9893a5', // muted
      surface2: '#cecacd', // highlight high
      surface1: '#dfdad9', // highlight med
      surface0: '#f2e9e1', // overlay
      base: '#faf4ed', // base
    },
  },

  // ── Dracula ────────────────────────────────────────────────────────────────
  // Spec (palette, ANSI, UI backgrounds): https://draculatheme.com/spec
  {
    id: 'dracula',
    name: 'Dracula',
    family: 'Dracula',
    dark: true,
    source: 'https://github.com/dracula/alacritty/blob/master/dracula.toml',
    terminal: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#f8f8f2',
      selection: '#44475a',
      ansi: [
        '#21222c', '#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#f8f8f2',
        '#6272a4', '#ff6e6e', '#69ff94', '#ffffa5', '#d6acff', '#ff92df', '#a4ffff', '#ffffff',
      ],
    },
    accents: {
      rosewater: '#ff6e6e', // bright red
      flamingo: '#ff6e6e', // bright red
      pink: '#ff79c6', // pink
      mauve: '#bd93f9', // purple
      red: '#ff5555', // red
      maroon: '#ff6e6e', // bright red
      peach: '#ffb86c', // orange
      yellow: '#f1fa8c', // yellow
      green: '#50fa7b', // green
      teal: '#a4ffff', // bright cyan
      sky: '#8be9fd', // cyan
      sapphire: '#8be9fd', // cyan
      blue: '#bd93f9', // purple (Dracula's ANSI blue)
      lavender: '#d6acff', // bright blue
    },
    neutrals: {
      text: '#f8f8f2', // foreground
      overlay0: '#6272a4', // comment
      surface1: '#44475a', // selection
      surface0: '#343746', // background light (floating elements)
      base: '#282a36', // background
      mantle: '#21222c', // background dark
      crust: '#191a21', // background darker
    },
  },

  // ── Nord ───────────────────────────────────────────────────────────────────
  // Palette nord0–nord15: https://github.com/nordtheme/nord/blob/develop/src/nord.css
  {
    id: 'nord',
    name: 'Nord',
    family: 'Nord',
    dark: true,
    source: 'https://github.com/nordtheme/alacritty/blob/main/src/nord.yaml',
    terminal: {
      background: '#2e3440',
      foreground: '#d8dee9',
      cursor: '#d8dee9',
      selection: '#4c566a',
      ansi: [
        '#3b4252', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#88c0d0', '#e5e9f0',
        '#4c566a', '#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1', '#b48ead', '#8fbcbb', '#eceff4',
      ],
    },
    accents: {
      rosewater: '#d08770', // nord12
      flamingo: '#bf616a', // nord11
      pink: '#b48ead', // nord15
      mauve: '#b48ead', // nord15
      red: '#bf616a', // nord11
      maroon: '#bf616a', // nord11
      peach: '#d08770', // nord12
      yellow: '#ebcb8b', // nord13
      green: '#a3be8c', // nord14
      teal: '#8fbcbb', // nord7
      sky: '#88c0d0', // nord8
      sapphire: '#81a1c1', // nord9
      blue: '#5e81ac', // nord10
      lavender: '#81a1c1', // nord9
    },
    neutrals: {
      text: '#d8dee9', // nord4
      overlay0: '#616e88', // nord3 brightened (comments, nordtheme/vim)
      surface2: '#4c566a', // nord3
      surface1: '#434c5e', // nord2
      surface0: '#3b4252', // nord1
      base: '#2e3440', // nord0
    },
  },

  // ── Gruvbox ────────────────────────────────────────────────────────────────
  // Palette: https://github.com/morhetz/gruvbox/blob/master/colors/gruvbox.vim
  // Cursor = fg (st/iTerm2 ports); selection = bg3, gruvbox.vim's Visual background.
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    family: 'Gruvbox',
    dark: true,
    source: 'https://github.com/morhetz/gruvbox-contrib/blob/master/termite/gruvbox-dark',
    terminal: {
      background: '#282828',
      foreground: '#ebdbb2',
      cursor: '#ebdbb2',
      selection: '#665c54',
      ansi: [
        '#282828', '#cc241d', '#98971a', '#d79921', '#458588', '#b16286', '#689d6a', '#a89984',
        '#928374', '#fb4934', '#b8bb26', '#fabd2f', '#83a598', '#d3869b', '#8ec07c', '#ebdbb2',
      ],
    },
    accents: {
      rosewater: '#d3869b', // bright purple
      flamingo: '#d3869b', // bright purple
      pink: '#b16286', // neutral purple
      mauve: '#d3869b', // bright purple
      red: '#fb4934', // bright red
      maroon: '#d3869b', // bright purple
      peach: '#fe8019', // bright orange
      yellow: '#fabd2f', // bright yellow
      green: '#b8bb26', // bright green
      teal: '#8ec07c', // bright aqua
      sky: '#83a598', // bright blue
      sapphire: '#458588', // neutral blue
      blue: '#83a598', // bright blue
      lavender: '#83a598', // bright blue
    },
    neutrals: {
      text: '#ebdbb2', // fg1
      subtext1: '#d5c4a1', // fg2
      subtext0: '#bdae93', // fg3
      overlay2: '#a89984', // fg4
      overlay1: '#928374', // gray (comments)
      overlay0: '#7c6f64', // bg4
      surface2: '#665c54', // bg3
      surface1: '#504945', // bg2
      surface0: '#3c3836', // bg1
      base: '#282828', // bg0
      mantle: '#1d2021', // bg0_h
    },
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox Light',
    family: 'Gruvbox',
    dark: false,
    source: 'https://github.com/morhetz/gruvbox-contrib/blob/master/termite/gruvbox-light',
    terminal: {
      background: '#fbf1c7',
      foreground: '#3c3836',
      cursor: '#3c3836',
      selection: '#bdae93',
      ansi: [
        '#fbf1c7', '#cc241d', '#98971a', '#d79921', '#458588', '#b16286', '#689d6a', '#7c6f64',
        '#928374', '#9d0006', '#79740e', '#b57614', '#076678', '#8f3f71', '#427b58', '#3c3836',
      ],
    },
    accents: {
      rosewater: '#b16286', // neutral purple
      flamingo: '#b16286', // neutral purple
      pink: '#8f3f71', // faded purple
      mauve: '#8f3f71', // faded purple
      red: '#9d0006', // faded red
      maroon: '#cc241d', // neutral red
      peach: '#af3a03', // faded orange
      yellow: '#b57614', // faded yellow
      green: '#79740e', // faded green
      teal: '#427b58', // faded aqua
      sky: '#076678', // faded blue
      sapphire: '#458588', // neutral blue
      blue: '#076678', // faded blue
      lavender: '#076678', // faded blue
    },
    neutrals: {
      text: '#3c3836', // fg1
      subtext1: '#504945', // fg2
      subtext0: '#665c54', // fg3
      overlay2: '#7c6f64', // fg4
      overlay1: '#928374', // gray (comments)
      overlay0: '#a89984', // bg4
      surface2: '#bdae93', // bg3
      surface1: '#d5c4a1', // bg2
      surface0: '#ebdbb2', // bg1
      base: '#fbf1c7', // bg0
    },
  },

  // ── Tokyo Night ────────────────────────────────────────────────────────────
  // Palette: https://github.com/folke/tokyonight.nvim/blob/main/lua/tokyonight/colors/storm.lua
  // (night.lua only overrides bg / bg_dark / bg_dark1)
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    family: 'Tokyo Night',
    dark: true,
    source: 'https://github.com/folke/tokyonight.nvim/blob/main/extras/kitty/tokyonight_night.conf',
    terminal: {
      background: '#1a1b26',
      foreground: '#c0caf5',
      cursor: '#c0caf5',
      selection: '#283457',
      ansi: [
        '#15161e', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#bb9af7', '#7dcfff', '#a9b1d6',
        '#414868', '#ff899d', '#9fe044', '#faba4a', '#8db0ff', '#c7a9ff', '#a4daff', '#c0caf5',
      ],
    },
    accents: {
      rosewater: '#f7768e', // red
      flamingo: '#f7768e', // red
      pink: '#ff007c', // magenta2
      mauve: '#bb9af7', // magenta
      red: '#f7768e', // red
      maroon: '#f7768e', // red
      peach: '#ff9e64', // orange
      yellow: '#e0af68', // yellow
      green: '#9ece6a', // green
      teal: '#73daca', // green1
      sky: '#89ddff', // blue5
      sapphire: '#7dcfff', // cyan
      blue: '#7aa2f7', // blue
      lavender: '#7aa2f7', // blue
    },
    neutrals: {
      text: '#c0caf5', // fg
      subtext1: '#a9b1d6', // fg_dark
      overlay1: '#737aa2', // dark5
      overlay0: '#565f89', // comment
      surface2: '#414868', // terminal_black
      surface1: '#3b4261', // fg_gutter
      surface0: '#292e42', // bg_highlight
      base: '#1a1b26', // bg
      mantle: '#16161e', // bg_dark
      crust: '#0c0e14', // bg_dark1
    },
  },
  {
    id: 'tokyo-night-storm',
    name: 'Tokyo Night Storm',
    family: 'Tokyo Night',
    dark: true,
    source: 'https://github.com/folke/tokyonight.nvim/blob/main/extras/kitty/tokyonight_storm.conf',
    terminal: {
      background: '#24283b',
      foreground: '#c0caf5',
      cursor: '#c0caf5',
      selection: '#2e3c64',
      ansi: [
        '#1d202f', '#f7768e', '#9ece6a', '#e0af68', '#7aa2f7', '#bb9af7', '#7dcfff', '#a9b1d6',
        '#414868', '#ff899d', '#9fe044', '#faba4a', '#8db0ff', '#c7a9ff', '#a4daff', '#c0caf5',
      ],
    },
    accents: {
      rosewater: '#f7768e', // red
      flamingo: '#f7768e', // red
      pink: '#ff007c', // magenta2
      mauve: '#bb9af7', // magenta
      red: '#f7768e', // red
      maroon: '#f7768e', // red
      peach: '#ff9e64', // orange
      yellow: '#e0af68', // yellow
      green: '#9ece6a', // green
      teal: '#73daca', // green1
      sky: '#89ddff', // blue5
      sapphire: '#7dcfff', // cyan
      blue: '#7aa2f7', // blue
      lavender: '#7aa2f7', // blue
    },
    neutrals: {
      text: '#c0caf5', // fg
      subtext1: '#a9b1d6', // fg_dark
      overlay1: '#737aa2', // dark5
      overlay0: '#565f89', // comment
      surface2: '#414868', // terminal_black
      surface1: '#3b4261', // fg_gutter
      surface0: '#292e42', // bg_highlight
      base: '#24283b', // bg
      mantle: '#1f2335', // bg_dark
      crust: '#1b1e2d', // bg_dark1
    },
  },

  // ── One Dark (Atom) ────────────────────────────────────────────────────────
  // Atom never shipped a terminal port, so `terminal` is mbadolato's "Atom One Dark".
  // Accents/neutrals: Atom's one-dark-syntax colors.less / syntax-variables.less and
  // one-dark-ui ui-variables (HSL definitions converted to hex):
  // https://github.com/atom/atom/tree/master/packages/one-dark-syntax/styles
  {
    id: 'one-dark',
    name: 'One Dark',
    family: 'One Dark',
    dark: true,
    source:
      'https://github.com/mbadolato/iTerm2-Color-Schemes/blob/master/alacritty/Atom%20One%20Dark.toml (fallback: mbadolato/iTerm2-Color-Schemes; Atom One Dark has no official terminal port)',
    terminal: {
      background: '#21252b',
      foreground: '#abb2bf',
      cursor: '#abb2bf',
      selection: '#323844',
      ansi: [
        '#21252b', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#abb2bf',
        '#767676', '#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#abb2bf',
      ],
    },
    accents: {
      rosewater: '#e06c75', // hue-5 (red 1)
      flamingo: '#e06c75', // hue-5
      pink: '#c678dd', // hue-3 (purple)
      mauve: '#c678dd', // hue-3
      red: '#e06c75', // hue-5
      maroon: '#e06c75', // hue-5
      peach: '#d19a66', // hue-6 (orange 1)
      yellow: '#e5c07b', // hue-6-2 (orange 2)
      green: '#98c379', // hue-4
      teal: '#56b6c2', // hue-1 (cyan)
      sky: '#56b6c2', // hue-1
      sapphire: '#61afef', // hue-2 (blue)
      blue: '#61afef', // hue-2
      lavender: '#528bff', // syntax-accent
    },
    neutrals: {
      text: '#abb2bf', // mono-1 (syntax-fg)
      subtext0: '#828997', // mono-2
      overlay0: '#5c6370', // mono-3 (comments)
      surface1: '#3e4451', // syntax-selection-color
      surface0: '#31363f', // ui background-color-highlight
      base: '#282c34', // syntax-bg
      mantle: '#21252b', // ui level-3 (tool panels)
      crust: '#1b1d23', // ui input-background-color
    },
  },

  // ── Solarized ──────────────────────────────────────────────────────────────
  // Hex palette from https://github.com/altercation/solarized#the-values. The iTerm2 port
  // stores calibrated floats, so its slots are mapped back to the canonical hex values.
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    family: 'Solarized',
    dark: true,
    source: 'https://github.com/altercation/solarized/blob/master/iterm2-colors-solarized/Solarized%20Dark.itermcolors',
    terminal: {
      background: '#002b36', // base03
      foreground: '#839496', // base0
      cursor: '#839496', // base0
      selection: '#073642', // base02
      ansi: [
        '#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
        '#002b36', '#cb4b16', '#586e75', '#657b83', '#839496', '#6c71c4', '#93a1a1', '#fdf6e3',
      ],
    },
    accents: {
      rosewater: '#cb4b16', // orange
      flamingo: '#dc322f', // red
      pink: '#d33682', // magenta
      mauve: '#6c71c4', // violet
      red: '#dc322f', // red
      maroon: '#dc322f', // red
      peach: '#cb4b16', // orange
      yellow: '#b58900', // yellow
      green: '#859900', // green
      teal: '#2aa198', // cyan
      sky: '#2aa198', // cyan
      sapphire: '#268bd2', // blue
      blue: '#268bd2', // blue
      lavender: '#6c71c4', // violet
    },
    neutrals: {
      text: '#839496', // base0 (body text)
      overlay2: '#586e75', // base01 (comments / secondary content)
      surface0: '#073642', // base02 (background highlights)
      base: '#002b36', // base03 (background)
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    family: 'Solarized',
    dark: false,
    source: 'https://github.com/altercation/solarized/blob/master/iterm2-colors-solarized/Solarized%20Light.itermcolors',
    terminal: {
      background: '#fdf6e3', // base3
      foreground: '#657b83', // base00
      cursor: '#657b83', // base00
      selection: '#eee8d5', // base2
      ansi: [
        '#073642', '#dc322f', '#859900', '#b58900', '#268bd2', '#d33682', '#2aa198', '#eee8d5',
        '#002b36', '#cb4b16', '#586e75', '#657b83', '#839496', '#6c71c4', '#93a1a1', '#fdf6e3',
      ],
    },
    accents: {
      rosewater: '#cb4b16', // orange
      flamingo: '#dc322f', // red
      pink: '#d33682', // magenta
      mauve: '#6c71c4', // violet
      red: '#dc322f', // red
      maroon: '#dc322f', // red
      peach: '#cb4b16', // orange
      yellow: '#b58900', // yellow
      green: '#859900', // green
      teal: '#2aa198', // cyan
      sky: '#2aa198', // cyan
      sapphire: '#268bd2', // blue
      blue: '#268bd2', // blue
      lavender: '#6c71c4', // violet
    },
    neutrals: {
      text: '#657b83', // base00 (body text)
      overlay2: '#93a1a1', // base1 (comments / secondary content)
      surface0: '#eee8d5', // base2 (background highlights)
      base: '#fdf6e3', // base3 (background)
    },
  },

  // ── Everforest ─────────────────────────────────────────────────────────────
  // Palette (dark, medium contrast): https://github.com/sainnhe/everforest/blob/master/palette.md
  // Terminal: the author's Alacritty port, linked from the official wiki. It sets no cursor or
  // selection, so those follow colors/everforest.vim (Cursor = reverse video, Visual = bg_visual).
  {
    id: 'everforest-dark',
    name: 'Everforest Dark',
    family: 'Everforest',
    dark: true,
    source: 'https://gist.github.com/sainnhe/6432f83181c4520ea87b5211fed27950',
    terminal: {
      background: '#2d353b',
      foreground: '#d3c6aa',
      cursor: '#d3c6aa',
      selection: '#543a48',
      ansi: [
        '#475258', '#e67e80', '#a7c080', '#dbbc7f', '#7fbbb3', '#d699b6', '#83c092', '#d3c6aa',
        '#475258', '#e67e80', '#a7c080', '#dbbc7f', '#7fbbb3', '#d699b6', '#83c092', '#d3c6aa',
      ],
    },
    accents: {
      rosewater: '#e69875', // orange
      flamingo: '#e67e80', // red
      pink: '#d699b6', // purple
      mauve: '#d699b6', // purple
      red: '#e67e80', // red
      maroon: '#d699b6', // purple
      peach: '#e69875', // orange
      yellow: '#dbbc7f', // yellow
      green: '#a7c080', // green
      teal: '#83c092', // aqua
      sky: '#7fbbb3', // blue
      sapphire: '#7fbbb3', // blue
      blue: '#7fbbb3', // blue
      lavender: '#d699b6', // purple
    },
    neutrals: {
      text: '#d3c6aa', // fg
      subtext0: '#9da9a0', // grey2
      overlay2: '#859289', // grey1 (comments)
      overlay1: '#7a8478', // grey0
      surface2: '#475258', // bg3
      surface1: '#3d484d', // bg2
      surface0: '#343f44', // bg1
      base: '#2d353b', // bg0
      mantle: '#232a2e', // bg_dim
    },
  },

  // ── Kanagawa ───────────────────────────────────────────────────────────────
  // Palette: https://github.com/rebelot/kanagawa.nvim/blob/master/lua/kanagawa/colors.lua
  // (kitty port matches the theme's own `term` table in lua/kanagawa/themes.lua)
  {
    id: 'kanagawa-wave',
    name: 'Kanagawa Wave',
    family: 'Kanagawa',
    dark: true,
    source: 'https://github.com/rebelot/kanagawa.nvim/blob/master/extras/kitty/kanagawa.conf',
    terminal: {
      background: '#1f1f28',
      foreground: '#dcd7ba',
      cursor: '#c8c093',
      selection: '#2d4f67',
      ansi: [
        '#16161d', '#c34043', '#76946a', '#c0a36e', '#7e9cd8', '#957fb8', '#6a9589', '#c8c093',
        '#727169', '#e82424', '#98bb6c', '#e6c384', '#7fb4ca', '#938aa9', '#7aa89f', '#dcd7ba',
      ],
    },
    accents: {
      rosewater: '#e46876', // waveRed
      flamingo: '#e46876', // waveRed
      pink: '#d27e99', // sakuraPink
      mauve: '#957fb8', // oniViolet
      red: '#ff5d62', // peachRed
      maroon: '#e46876', // waveRed
      peach: '#ffa066', // surimiOrange
      yellow: '#e6c384', // carpYellow
      green: '#98bb6c', // springGreen
      teal: '#7aa89f', // waveAqua2
      sky: '#a3d4d5', // lightBlue
      sapphire: '#7fb4ca', // springBlue
      blue: '#7e9cd8', // crystalBlue
      lavender: '#b8b4d0', // oniViolet2
    },
    neutrals: {
      text: '#dcd7ba', // fujiWhite
      subtext1: '#c8c093', // oldWhite (fg_dim)
      overlay0: '#727169', // fujiGray (comments)
      surface2: '#54546d', // sumiInk6
      surface1: '#363646', // sumiInk5
      surface0: '#2a2a37', // sumiInk4
      base: '#1f1f28', // sumiInk3
      mantle: '#181820', // sumiInk1 (bg_dim)
      crust: '#16161d', // sumiInk0
    },
  },

  // ── Monokai ────────────────────────────────────────────────────────────────
  // Original Monokai.tmTheme by Wimer Hazenberg (accents/neutrals):
  // https://web.archive.org/web/20110111024250/http://www.monokai.nl/blog/wp-content/asdev/Monokai.tmTheme
  // There is no official terminal port; `terminal` is mbadolato's "Monokai Classic", whose
  // foreground/cursor/selection/bright-black differ from the 2006 tmTheme.
  {
    id: 'monokai',
    name: 'Monokai',
    family: 'Monokai',
    dark: true,
    source:
      'https://github.com/mbadolato/iTerm2-Color-Schemes/blob/master/alacritty/Monokai%20Classic.toml (fallback: mbadolato/iTerm2-Color-Schemes; classic Monokai has no official terminal port)',
    terminal: {
      background: '#272822',
      foreground: '#fdfff1',
      cursor: '#c0c1b5',
      selection: '#57584f',
      ansi: [
        '#272822', '#f92672', '#a6e22e', '#e6db74', '#fd971f', '#ae81ff', '#66d9ef', '#fdfff1',
        '#6e7066', '#f92672', '#a6e22e', '#e6db74', '#fd971f', '#ae81ff', '#66d9ef', '#fdfff1',
      ],
    },
    accents: {
      rosewater: '#fd971f', // orange
      flamingo: '#f92672', // pink-red (keywords)
      pink: '#f92672',
      mauve: '#ae81ff', // purple (constants)
      red: '#f92672',
      maroon: '#f92672',
      peach: '#fd971f', // orange (parameters)
      yellow: '#e6db74', // yellow (strings)
      green: '#a6e22e', // green (functions)
      teal: '#66d9ef', // cyan (types)
      sky: '#66d9ef',
      sapphire: '#66d9ef',
      blue: '#66d9ef',
      lavender: '#ae81ff', // purple
    },
    neutrals: {
      text: '#f8f8f2', // foreground
      overlay0: '#75715e', // comment
      surface1: '#49483e', // selection / line highlight
      base: '#272822', // background
    },
  },

  // ── Ayu ────────────────────────────────────────────────────────────────────
  // Named palette: https://github.com/ayu-theme/ayu-colors/blob/master/themes/mirage.yaml
  // Terminal: the official VS Code theme's terminal.* colors. Cursor = editorCursor.foreground;
  // selection = editor.selectionBackground (#409fff at 25%) flattened onto the background.
  {
    id: 'ayu-mirage',
    name: 'Ayu Mirage',
    family: 'Ayu',
    dark: true,
    source: 'https://github.com/ayu-theme/vscode-ayu/blob/master/ayu-mirage.json',
    terminal: {
      background: '#1f2430',
      foreground: '#cccac2',
      cursor: '#ffcc66',
      selection: '#274364',
      ansi: [
        '#171b24', '#f28273', '#87d96c', '#fcca60', '#6acdff', '#ddbbff', '#93e2c8', '#c7c7c7',
        '#686868', '#f28779', '#d5ff80', '#ffcd66', '#73d0ff', '#dfbfff', '#95e6cb', '#ffffff',
      ],
    },
    accents: {
      rosewater: '#d9be98', // peach
      flamingo: '#f27983', // vcs.removed
      pink: '#dfbfff', // purple
      mauve: '#dfbfff', // purple
      red: '#f28779', // red
      maroon: '#f27983', // vcs.removed
      peach: '#ffa659', // orange
      yellow: '#ffcd66', // yellow
      green: '#87d96c', // vcs.added
      teal: '#95e6cb', // teal
      sky: '#5ccfe6', // indigo
      sapphire: '#73d0ff', // blue
      blue: '#80bfff', // vcs.modified
      lavender: '#dfbfff', // purple
    },
    neutrals: {
      text: '#cccac2', // editor.fg
      overlay1: '#6e7c8f', // gray (comments)
      surface1: '#282e3b', // ui.panel.bg
      surface0: '#242936', // surface.lift (editor background)
      base: '#1f2430', // surface.base (ui.bg)
      mantle: '#181c26', // surface.sunk
    },
  },

  // ── xterm ──────────────────────────────────────────────────────────────────
  // Stock xterm colors (XTerm-col.ad resource names resolved via X11 rgb.txt) with the
  // "white text on a dark background" pair from the same file (gray90 on black).
  // cursorColor and highlightColor both default to the foreground; selections are reverse video.
  {
    id: 'xterm',
    name: 'xterm (classic)',
    family: 'xterm',
    dark: true,
    source: 'https://github.com/ThomasDickey/xterm-snapshots/blob/master/XTerm-col.ad',
    terminal: {
      background: '#000000', // black
      foreground: '#e5e5e5', // gray90
      cursor: '#e5e5e5',
      selection: '#e5e5e5',
      ansi: [
        '#000000', '#cd0000', '#00cd00', '#cdcd00', '#0000ee', '#cd00cd', '#00cdcd', '#e5e5e5',
        '#7f7f7f', '#ff0000', '#00ff00', '#ffff00', '#5c5cff', '#ff00ff', '#00ffff', '#ffffff',
      ],
    },
    accents: {
      rosewater: '#ff0000', // red
      flamingo: '#ff0000', // red
      pink: '#ff00ff', // magenta
      mauve: '#cd00cd', // magenta3
      red: '#cd0000', // red3
      maroon: '#ff0000', // red
      peach: '#cdcd00', // yellow3
      yellow: '#ffff00', // yellow
      green: '#00cd00', // green3
      teal: '#00cdcd', // cyan3
      sky: '#00ffff', // cyan
      sapphire: '#00cdcd', // cyan3
      blue: '#0000ee', // blue2
      lavender: '#5c5cff', // rgb:5c/5c/ff
    },
    neutrals: {
      text: '#e5e5e5', // gray90
      overlay2: '#7f7f7f', // gray50
      base: '#000000', // black
    },
  },
];
