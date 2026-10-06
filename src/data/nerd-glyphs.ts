/** Curated Nerd Font glyphs (Nerd Fonts v3.5.1, Symbols Nerd Font Mono). Generated — see NERD-FONTS-LICENSE.txt. */
export type GlyphCategory = 'powerline' | 'os' | 'dev' | 'git' | 'files' | 'status' | 'time' | 'arrows' | 'system' | 'misc';

export interface NerdGlyph {
  /** Nerd Fonts class name without the `nf-` prefix, e.g. 'pl-left_hard_divider'. */
  name: string;
  /** Hex code point, lowercase, no prefix, e.g. 'e0b0'. */
  code: string;
  /** The character itself, written as a \u{…} escape in source. */
  char: string;
  category: GlyphCategory;
  /** Short human label, e.g. 'Powerline arrow (right)'. */
  label: string;
  /** Extra search words. */
  keywords?: string[];
}

export const NERD_FONT_VERSION = 'v3.5.1';

export const NERD_GLYPHS: NerdGlyph[] = [
  // powerline
  { name: 'pl-branch', code: 'e0a0', char: '\u{e0a0}', category: 'powerline', label: 'Powerline branch', keywords: ['git', 'vcs'] },
  { name: 'pl-line_number', code: 'e0a1', char: '\u{e0a1}', category: 'powerline', label: 'Powerline line number', keywords: ['ln', 'current_line'] },
  { name: 'pl-readonly', code: 'e0a2', char: '\u{e0a2}', category: 'powerline', label: 'Powerline padlock (read-only)', keywords: ['lock', 'readonly', 'hostname'] },
  { name: 'ple-column_number', code: 'e0a3', char: '\u{e0a3}', category: 'powerline', label: 'Powerline column number', keywords: ['cn', 'current_column'] },
  { name: 'pl-left_hard_divider', code: 'e0b0', char: '\u{e0b0}', category: 'powerline', label: 'Powerline arrow (right)', keywords: ['separator', 'divider', 'triangle', 'solid', 'segment'] },
  { name: 'pl-left_soft_divider', code: 'e0b1', char: '\u{e0b1}', category: 'powerline', label: 'Powerline thin arrow (right)', keywords: ['separator', 'divider', 'chevron', 'thin'] },
  { name: 'pl-right_hard_divider', code: 'e0b2', char: '\u{e0b2}', category: 'powerline', label: 'Powerline arrow (left)', keywords: ['separator', 'divider', 'triangle', 'solid', 'segment'] },
  { name: 'pl-right_soft_divider', code: 'e0b3', char: '\u{e0b3}', category: 'powerline', label: 'Powerline thin arrow (left)', keywords: ['separator', 'divider', 'chevron', 'thin'] },
  { name: 'ple-right_half_circle_thick', code: 'e0b4', char: '\u{e0b4}', category: 'powerline', label: 'Rounded cap (right)', keywords: ['separator', 'divider', 'round', 'semicircle', 'pill'] },
  { name: 'ple-right_half_circle_thin', code: 'e0b5', char: '\u{e0b5}', category: 'powerline', label: 'Thin rounded divider (right)', keywords: ['separator', 'divider', 'round', 'semicircle', 'thin'] },
  { name: 'ple-left_half_circle_thick', code: 'e0b6', char: '\u{e0b6}', category: 'powerline', label: 'Rounded cap (left)', keywords: ['separator', 'divider', 'round', 'semicircle', 'pill'] },
  { name: 'ple-left_half_circle_thin', code: 'e0b7', char: '\u{e0b7}', category: 'powerline', label: 'Thin rounded divider (left)', keywords: ['separator', 'divider', 'round', 'semicircle', 'thin'] },
  { name: 'ple-lower_left_triangle', code: 'e0b8', char: '\u{e0b8}', category: 'powerline', label: 'Lower-left triangle', keywords: ['separator', 'divider', 'slant', 'diagonal', 'wedge'] },
  { name: 'ple-backslash_separator', code: 'e0b9', char: '\u{e0b9}', category: 'powerline', label: 'Backslash divider', keywords: ['separator', 'divider', 'slant', 'diagonal', 'thin'] },
  { name: 'ple-lower_right_triangle', code: 'e0ba', char: '\u{e0ba}', category: 'powerline', label: 'Lower-right triangle', keywords: ['separator', 'divider', 'slant', 'diagonal', 'wedge'] },
  { name: 'ple-forwardslash_separator', code: 'e0bb', char: '\u{e0bb}', category: 'powerline', label: 'Slash divider', keywords: ['separator', 'divider', 'slant', 'diagonal', 'thin'] },
  { name: 'ple-upper_left_triangle', code: 'e0bc', char: '\u{e0bc}', category: 'powerline', label: 'Upper-left triangle', keywords: ['separator', 'divider', 'slant', 'diagonal', 'wedge'] },
  { name: 'ple-forwardslash_separator_redundant', code: 'e0bd', char: '\u{e0bd}', category: 'powerline', label: 'Slash divider (alt)', keywords: ['separator', 'divider', 'slant', 'diagonal', 'thin'] },
  { name: 'ple-upper_right_triangle', code: 'e0be', char: '\u{e0be}', category: 'powerline', label: 'Upper-right triangle', keywords: ['separator', 'divider', 'slant', 'diagonal', 'wedge'] },
  { name: 'ple-backslash_separator_redundant', code: 'e0bf', char: '\u{e0bf}', category: 'powerline', label: 'Backslash divider (alt)', keywords: ['separator', 'divider', 'slant', 'diagonal', 'thin'] },
  { name: 'ple-flame_thick', code: 'e0c0', char: '\u{e0c0}', category: 'powerline', label: 'Flame (right)', keywords: ['separator', 'divider', 'fire'] },
  { name: 'ple-flame_thin', code: 'e0c1', char: '\u{e0c1}', category: 'powerline', label: 'Thin flame (right)', keywords: ['separator', 'divider', 'fire'] },
  { name: 'ple-flame_thick_mirrored', code: 'e0c2', char: '\u{e0c2}', category: 'powerline', label: 'Flame (left)', keywords: ['separator', 'divider', 'fire', 'mirrored'] },
  { name: 'ple-flame_thin_mirrored', code: 'e0c3', char: '\u{e0c3}', category: 'powerline', label: 'Thin flame (left)', keywords: ['separator', 'divider', 'fire', 'mirrored'] },
  { name: 'ple-pixelated_squares_small', code: 'e0c4', char: '\u{e0c4}', category: 'powerline', label: 'Small pixels (right)', keywords: ['separator', 'divider', 'pixelated', 'squares', 'dither', 'retro'] },
  { name: 'ple-pixelated_squares_small_mirrored', code: 'e0c5', char: '\u{e0c5}', category: 'powerline', label: 'Small pixels (left)', keywords: ['separator', 'divider', 'pixelated', 'squares', 'dither', 'retro'] },
  { name: 'ple-pixelated_squares_big', code: 'e0c6', char: '\u{e0c6}', category: 'powerline', label: 'Big pixels (right)', keywords: ['separator', 'divider', 'pixelated', 'squares', 'dither', 'retro'] },
  { name: 'ple-pixelated_squares_big_mirrored', code: 'e0c7', char: '\u{e0c7}', category: 'powerline', label: 'Big pixels (left)', keywords: ['separator', 'divider', 'pixelated', 'squares', 'dither', 'retro'] },
  { name: 'ple-ice_waveform', code: 'e0c8', char: '\u{e0c8}', category: 'powerline', label: 'Ice waveform (right)', keywords: ['separator', 'divider', 'icicles', 'spikes', 'wave'] },
  { name: 'ple-ice_waveform_mirrored', code: 'e0ca', char: '\u{e0ca}', category: 'powerline', label: 'Ice waveform (left)', keywords: ['separator', 'divider', 'icicles', 'spikes', 'wave', 'mirrored'] },
  { name: 'ple-honeycomb', code: 'e0cc', char: '\u{e0cc}', category: 'powerline', label: 'Honeycomb', keywords: ['separator', 'divider', 'hexagon'] },
  { name: 'ple-honeycomb_outline', code: 'e0cd', char: '\u{e0cd}', category: 'powerline', label: 'Honeycomb (outline)', keywords: ['separator', 'divider', 'hexagon'] },
  { name: 'ple-lego_separator', code: 'e0ce', char: '\u{e0ce}', category: 'powerline', label: 'Lego divider', keywords: ['separator', 'divider', 'brick', 'block'] },
  { name: 'ple-lego_separator_thin', code: 'e0cf', char: '\u{e0cf}', category: 'powerline', label: 'Lego divider (thin)', keywords: ['separator', 'divider', 'brick', 'block'] },
  { name: 'ple-lego_block_facing', code: 'e0d0', char: '\u{e0d0}', category: 'powerline', label: 'Lego block (facing)', keywords: ['brick', 'studs'] },
  { name: 'ple-lego_block_sideways', code: 'e0d1', char: '\u{e0d1}', category: 'powerline', label: 'Lego block (sideways)', keywords: ['brick', 'studs'] },
  { name: 'ple-trapezoid_top_bottom', code: 'e0d2', char: '\u{e0d2}', category: 'powerline', label: 'Trapezoids (right)', keywords: ['separator', 'divider', 'notch'] },
  { name: 'ple-trapezoid_top_bottom_mirrored', code: 'e0d4', char: '\u{e0d4}', category: 'powerline', label: 'Trapezoids (left)', keywords: ['separator', 'divider', 'notch', 'mirrored'] },
  { name: 'ple-right_hard_divider_inverse', code: 'e0d6', char: '\u{e0d6}', category: 'powerline', label: 'Inverted arrow (right)', keywords: ['separator', 'divider', 'inverse', 'notch', 'cutout'] },
  { name: 'ple-left_hard_divider_inverse', code: 'e0d7', char: '\u{e0d7}', category: 'powerline', label: 'Inverted arrow (left)', keywords: ['separator', 'divider', 'inverse', 'notch', 'cutout'] },
  // os
  { name: 'linux-tux', code: 'f31a', char: '\u{f31a}', category: 'os', label: 'Linux (Tux)', keywords: ['linux', 'penguin', 'gnu'] },
  { name: 'fa-apple', code: 'f179', char: '\u{f179}', category: 'os', label: 'Apple (macOS)', keywords: ['macos', 'mac', 'osx', 'darwin'] },
  { name: 'fa-windows', code: 'f17a', char: '\u{f17a}', category: 'os', label: 'Windows', keywords: ['microsoft', 'win', 'wsl'] },
  { name: 'dev-windows11', code: 'e8e5', char: '\u{e8e5}', category: 'os', label: 'Windows 11', keywords: ['microsoft', 'win11'] },
  { name: 'fa-android', code: 'f17b', char: '\u{f17b}', category: 'os', label: 'Android', keywords: ['termux', 'google', 'mobile'] },
  { name: 'linux-freebsd', code: 'f30c', char: '\u{f30c}', category: 'os', label: 'FreeBSD', keywords: ['bsd', 'unix', 'daemon'] },
  { name: 'linux-openbsd', code: 'f328', char: '\u{f328}', category: 'os', label: 'OpenBSD', keywords: ['bsd', 'unix', 'puffy'] },
  { name: 'fa-redhat', code: 'ef5d', char: '\u{ef5d}', category: 'os', label: 'Red Hat Enterprise Linux', keywords: ['rhel', 'redhat'] },
  { name: 'linux-rocky_linux', code: 'f32b', char: '\u{f32b}', category: 'os', label: 'Rocky Linux', keywords: ['rocky', 'rhel', 'enterprise'] },
  { name: 'linux-almalinux', code: 'f31d', char: '\u{f31d}', category: 'os', label: 'AlmaLinux', keywords: ['alma', 'rhel', 'enterprise'] },
  { name: 'linux-centos', code: 'f304', char: '\u{f304}', category: 'os', label: 'CentOS', keywords: ['rhel', 'stream'] },
  { name: 'linux-fedora', code: 'f30a', char: '\u{f30a}', category: 'os', label: 'Fedora', keywords: ['rpm', 'dnf'] },
  { name: 'linux-nobara', code: 'f380', char: '\u{f380}', category: 'os', label: 'Nobara', keywords: ['fedora', 'gaming'] },
  { name: 'fa-amazon', code: 'f270', char: '\u{f270}', category: 'os', label: 'Amazon Linux', keywords: ['amzn', 'aws', 'ec2'] },
  { name: 'linux-ubuntu', code: 'f31b', char: '\u{f31b}', category: 'os', label: 'Ubuntu', keywords: ['canonical', 'apt'] },
  { name: 'linux-debian', code: 'f306', char: '\u{f306}', category: 'os', label: 'Debian', keywords: ['apt', 'swirl'] },
  { name: 'linux-linuxmint', code: 'f30e', char: '\u{f30e}', category: 'os', label: 'Linux Mint', keywords: ['mint', 'linuxmint', 'cinnamon'] },
  { name: 'linux-pop_os', code: 'f32a', char: '\u{f32a}', category: 'os', label: 'Pop!_OS', keywords: ['pop', 'popos', 'system76'] },
  { name: 'linux-elementary', code: 'f309', char: '\u{f309}', category: 'os', label: 'elementary OS', keywords: ['elementaryos'] },
  { name: 'linux-zorin', code: 'f32f', char: '\u{f32f}', category: 'os', label: 'Zorin OS', keywords: ['zorinos'] },
  { name: 'linux-deepin', code: 'f321', char: '\u{f321}', category: 'os', label: 'deepin', keywords: ['linux'] },
  { name: 'linux-kali_linux', code: 'f327', char: '\u{f327}', category: 'os', label: 'Kali Linux', keywords: ['kali', 'pentest', 'security'] },
  { name: 'linux-parrot', code: 'f329', char: '\u{f329}', category: 'os', label: 'Parrot OS', keywords: ['parrot', 'pentest', 'security'] },
  { name: 'linux-raspberry_pi', code: 'f315', char: '\u{f315}', category: 'os', label: 'Raspberry Pi OS', keywords: ['raspbian', 'rpi', 'pi'] },
  { name: 'linux-archlinux', code: 'f303', char: '\u{f303}', category: 'os', label: 'Arch Linux', keywords: ['arch', 'pacman', 'btw'] },
  { name: 'linux-manjaro', code: 'f312', char: '\u{f312}', category: 'os', label: 'Manjaro', keywords: ['arch'] },
  { name: 'linux-endeavour', code: 'f322', char: '\u{f322}', category: 'os', label: 'EndeavourOS', keywords: ['endeavour', 'arch'] },
  { name: 'linux-garuda', code: 'f337', char: '\u{f337}', category: 'os', label: 'Garuda Linux', keywords: ['garuda', 'arch'] },
  { name: 'linux-artix', code: 'f31f', char: '\u{f31f}', category: 'os', label: 'Artix Linux', keywords: ['artix', 'arch'] },
  { name: 'linux-cachyos', code: 'f385', char: '\u{f385}', category: 'os', label: 'CachyOS', keywords: ['cachy', 'arch'] },
  { name: 'linux-alpine', code: 'f300', char: '\u{f300}', category: 'os', label: 'Alpine Linux', keywords: ['alpine', 'musl', 'container'] },
  { name: 'linux-opensuse', code: 'f314', char: '\u{f314}', category: 'os', label: 'openSUSE', keywords: ['suse', 'chameleon'] },
  { name: 'linux-leap', code: 'f37e', char: '\u{f37e}', category: 'os', label: 'openSUSE Leap', keywords: ['suse', 'opensuse-leap'] },
  { name: 'linux-tumbleweed', code: 'f37d', char: '\u{f37d}', category: 'os', label: 'openSUSE Tumbleweed', keywords: ['suse', 'opensuse-tumbleweed', 'rolling'] },
  { name: 'linux-gentoo', code: 'f30d', char: '\u{f30d}', category: 'os', label: 'Gentoo', keywords: ['portage', 'emerge'] },
  { name: 'linux-nixos', code: 'f313', char: '\u{f313}', category: 'os', label: 'NixOS', keywords: ['nix', 'snowflake'] },
  { name: 'linux-void', code: 'f32e', char: '\u{f32e}', category: 'os', label: 'Void Linux', keywords: ['void', 'xbps'] },
  { name: 'linux-slackware', code: 'f318', char: '\u{f318}', category: 'os', label: 'Slackware', keywords: ['slack'] },
  { name: 'linux-docker', code: 'f308', char: '\u{f308}', category: 'os', label: 'Docker (container)', keywords: ['container', 'whale', 'moby'] },
  // dev
  { name: 'dev-bash', code: 'e760', char: '\u{e760}', category: 'dev', label: 'Bash', keywords: ['shell', 'gnu', 'sh', 'terminal'] },
  { name: 'md-bash', code: 'f1183', char: '\u{f1183}', category: 'dev', label: 'Bash (shebang)', keywords: ['shell', 'shebang', 'script', '#!'] },
  { name: 'dev-zsh', code: 'e957', char: '\u{e957}', category: 'dev', label: 'Zsh', keywords: ['shell', 'z shell', 'oh-my-zsh'] },
  { name: 'dev-python', code: 'e73c', char: '\u{e73c}', category: 'dev', label: 'Python', keywords: ['py', 'pip', 'venv', 'virtualenv'] },
  { name: 'dev-anaconda', code: 'e715', char: '\u{e715}', category: 'dev', label: 'Anaconda / Conda', keywords: ['conda', 'miniconda', 'python', 'env'] },
  { name: 'md-nodejs', code: 'f0399', char: '\u{f0399}', category: 'dev', label: 'Node.js', keywords: ['node', 'nvm', 'javascript'] },
  { name: 'dev-npm', code: 'e71e', char: '\u{e71e}', category: 'dev', label: 'npm', keywords: ['node', 'package', 'registry'] },
  { name: 'dev-denojs', code: 'e7c0', char: '\u{e7c0}', category: 'dev', label: 'Deno', keywords: ['typescript', 'runtime'] },
  { name: 'dev-bun', code: 'e76f', char: '\u{e76f}', category: 'dev', label: 'Bun', keywords: ['javascript', 'runtime'] },
  { name: 'md-language_javascript', code: 'f031e', char: '\u{f031e}', category: 'dev', label: 'JavaScript', keywords: ['js', 'ecmascript'] },
  { name: 'md-language_typescript', code: 'f06e6', char: '\u{f06e6}', category: 'dev', label: 'TypeScript', keywords: ['ts'] },
  { name: 'dev-rust', code: 'e7a8', char: '\u{e7a8}', category: 'dev', label: 'Rust', keywords: ['cargo', 'rustc', 'crab'] },
  { name: 'md-language_go', code: 'f07d3', char: '\u{f07d3}', category: 'dev', label: 'Go', keywords: ['golang'] },
  { name: 'dev-java', code: 'e738', char: '\u{e738}', category: 'dev', label: 'Java', keywords: ['jdk', 'jvm', 'openjdk'] },
  { name: 'md-language_kotlin', code: 'f1219', char: '\u{f1219}', category: 'dev', label: 'Kotlin', keywords: ['jvm', 'android'] },
  { name: 'dev-ruby', code: 'e739', char: '\u{e739}', category: 'dev', label: 'Ruby', keywords: ['gem', 'rails', 'rbenv'] },
  { name: 'dev-php', code: 'e73d', char: '\u{e73d}', category: 'dev', label: 'PHP', keywords: ['composer', 'laravel'] },
  { name: 'md-language_lua', code: 'f08b1', char: '\u{f08b1}', category: 'dev', label: 'Lua', keywords: ['luajit'] },
  { name: 'custom-c', code: 'e61e', char: '\u{e61e}', category: 'dev', label: 'C', keywords: ['c language', 'clang', 'gcc'] },
  { name: 'dev-cplusplus', code: 'e7a3', char: '\u{e7a3}', category: 'dev', label: 'C++', keywords: ['cpp', 'cplusplus', 'g++'] },
  { name: 'md-language_csharp', code: 'f031b', char: '\u{f031b}', category: 'dev', label: 'C#', keywords: ['csharp', 'dotnet', '.net'] },
  { name: 'md-language_swift', code: 'f06e5', char: '\u{f06e5}', category: 'dev', label: 'Swift', keywords: ['apple', 'xcode'] },
  { name: 'dev-zig', code: 'e8ef', char: '\u{e8ef}', category: 'dev', label: 'Zig', keywords: ['ziglang'] },
  { name: 'md-language_haskell', code: 'f0c92', char: '\u{f0c92}', category: 'dev', label: 'Haskell', keywords: ['ghc', 'cabal', 'stack'] },
  { name: 'md-docker', code: 'f0868', char: '\u{f0868}', category: 'dev', label: 'Docker', keywords: ['container', 'whale', 'compose'] },
  { name: 'md-kubernetes', code: 'f10fe', char: '\u{f10fe}', category: 'dev', label: 'Kubernetes', keywords: ['k8s', 'kubectl', 'kube'] },
  { name: 'dev-helm', code: 'e7fb', char: '\u{e7fb}', category: 'dev', label: 'Helm', keywords: ['chart', 'kubernetes', 'k8s'] },
  { name: 'md-terraform', code: 'f1062', char: '\u{f1062}', category: 'dev', label: 'Terraform', keywords: ['tf', 'hashicorp', 'iac'] },
  { name: 'md-ansible', code: 'f109a', char: '\u{f109a}', category: 'dev', label: 'Ansible', keywords: ['automation', 'playbook'] },
  { name: 'fa-aws', code: 'f0ef', char: '\u{f0ef}', category: 'dev', label: 'AWS', keywords: ['amazon', 'cloud'] },
  { name: 'dev-azure', code: 'e754', char: '\u{e754}', category: 'dev', label: 'Azure', keywords: ['microsoft', 'cloud'] },
  { name: 'md-google_cloud', code: 'f11f6', char: '\u{f11f6}', category: 'dev', label: 'Google Cloud', keywords: ['gcp', 'gcloud', 'cloud'] },
  { name: 'fa-github', code: 'f09b', char: '\u{f09b}', category: 'dev', label: 'GitHub', keywords: ['git', 'octocat', 'gh'] },
  { name: 'fa-gitlab', code: 'f296', char: '\u{f296}', category: 'dev', label: 'GitLab', keywords: ['git', 'tanuki'] },
  { name: 'fa-bitbucket', code: 'f171', char: '\u{f171}', category: 'dev', label: 'Bitbucket', keywords: ['git', 'atlassian'] },
  { name: 'custom-vim', code: 'e62b', char: '\u{e62b}', category: 'dev', label: 'Vim', keywords: ['vi', 'editor'] },
  { name: 'linux-neovim', code: 'f36f', char: '\u{f36f}', category: 'dev', label: 'Neovim', keywords: ['nvim', 'vim', 'editor'] },
  { name: 'md-microsoft_visual_studio_code', code: 'f0a1e', char: '\u{f0a1e}', category: 'dev', label: 'VS Code', keywords: ['vscode', 'code', 'editor'] },
  { name: 'md-nix', code: 'f1105', char: '\u{f1105}', category: 'dev', label: 'Nix', keywords: ['nix-shell', 'flake', 'snowflake'] },
  { name: 'dev-tmux', code: 'e94c', char: '\u{e94c}', category: 'dev', label: 'tmux', keywords: ['multiplexer', 'session', 'terminal'] },
  { name: 'dev-redis', code: 'e76d', char: '\u{e76d}', category: 'dev', label: 'Redis', keywords: ['cache', 'database'] },
  { name: 'dev-postgresql', code: 'e76e', char: '\u{e76e}', category: 'dev', label: 'PostgreSQL', keywords: ['postgres', 'psql', 'database'] },
  { name: 'dev-mysql', code: 'e704', char: '\u{e704}', category: 'dev', label: 'MySQL', keywords: ['database', 'sql', 'dolphin'] },
  { name: 'dev-mongodb', code: 'e7a4', char: '\u{e7a4}', category: 'dev', label: 'MongoDB', keywords: ['mongo', 'database', 'nosql'] },
  { name: 'dev-sqlite', code: 'e7c4', char: '\u{e7c4}', category: 'dev', label: 'SQLite', keywords: ['database', 'sql'] },
  // git
  { name: 'dev-git', code: 'e702', char: '\u{e702}', category: 'git', label: 'Git', keywords: ['vcs', 'scm', 'logo'] },
  { name: 'fa-git', code: 'f1d3', char: '\u{f1d3}', category: 'git', label: 'Git (wordmark)', keywords: ['vcs', 'logo'] },
  { name: 'oct-git_branch', code: 'f418', char: '\u{f418}', category: 'git', label: 'Branch', keywords: ['git', 'checkout', 'vcs'] },
  { name: 'md-source_branch', code: 'f062c', char: '\u{f062c}', category: 'git', label: 'Branch (Material)', keywords: ['git', 'checkout', 'vcs'] },
  { name: 'oct-git_commit', code: 'f417', char: '\u{f417}', category: 'git', label: 'Commit', keywords: ['git', 'sha', 'hash', 'head'] },
  { name: 'oct-git_merge', code: 'f419', char: '\u{f419}', category: 'git', label: 'Merge', keywords: ['git'] },
  { name: 'oct-git_compare', code: 'f47f', char: '\u{f47f}', category: 'git', label: 'Compare', keywords: ['git', 'diverged', 'rebase'] },
  { name: 'oct-git_pull_request', code: 'f407', char: '\u{f407}', category: 'git', label: 'Pull request', keywords: ['git', 'pr', 'merge request', 'mr'] },
  { name: 'oct-repo_forked', code: 'f402', char: '\u{f402}', category: 'git', label: 'Fork', keywords: ['git', 'repository'] },
  { name: 'oct-repo', code: 'f401', char: '\u{f401}', category: 'git', label: 'Repository', keywords: ['git', 'repo', 'book'] },
  { name: 'oct-tag', code: 'f412', char: '\u{f412}', category: 'git', label: 'Tag', keywords: ['git', 'release', 'version'] },
  { name: 'cod-git_stash', code: 'ec26', char: '\u{ec26}', category: 'git', label: 'Stash', keywords: ['git', 'shelve'] },
  { name: 'oct-diff', code: 'f440', char: '\u{f440}', category: 'git', label: 'Diff', keywords: ['git', 'changes', 'plus minus'] },
  { name: 'oct-diff_added', code: 'f457', char: '\u{f457}', category: 'git', label: 'Added', keywords: ['git', 'staged', 'new', 'plus'] },
  { name: 'oct-diff_modified', code: 'f459', char: '\u{f459}', category: 'git', label: 'Modified', keywords: ['git', 'changed', 'dirty', 'unstaged'] },
  { name: 'oct-diff_removed', code: 'f458', char: '\u{f458}', category: 'git', label: 'Deleted', keywords: ['git', 'removed', 'minus'] },
  { name: 'oct-diff_renamed', code: 'f45a', char: '\u{f45a}', category: 'git', label: 'Renamed', keywords: ['git', 'moved'] },
  { name: 'cod-git_branch_conflicts', code: 'ec6e', char: '\u{ec6e}', category: 'git', label: 'Merge conflict', keywords: ['git', 'conflicted', 'unmerged'] },
  // files
  { name: 'fa-folder', code: 'f07b', char: '\u{f07b}', category: 'files', label: 'Folder', keywords: ['directory', 'dir', 'cwd'] },
  { name: 'md-folder_outline', code: 'f0256', char: '\u{f0256}', category: 'files', label: 'Folder (outline)', keywords: ['directory', 'dir', 'cwd'] },
  { name: 'fa-folder_open', code: 'f07c', char: '\u{f07c}', category: 'files', label: 'Folder (open)', keywords: ['directory', 'dir', 'cwd'] },
  { name: 'md-folder_home', code: 'f10b5', char: '\u{f10b5}', category: 'files', label: 'Home folder', keywords: ['directory', '~'] },
  { name: 'md-folder_lock', code: 'f0250', char: '\u{f0250}', category: 'files', label: 'Locked folder', keywords: ['directory', 'readonly', 'read-only', 'permission'] },
  { name: 'custom-folder_git', code: 'e5fb', char: '\u{e5fb}', category: 'files', label: 'Git folder', keywords: ['directory', 'repository', 'repo'] },
  { name: 'fa-home', code: 'f015', char: '\u{f015}', category: 'files', label: 'Home', keywords: ['house', '~'] },
  { name: 'fa-lock', code: 'f023', char: '\u{f023}', category: 'files', label: 'Lock', keywords: ['readonly', 'read-only', 'secure', 'padlock'] },
  { name: 'fa-unlock', code: 'f09c', char: '\u{f09c}', category: 'files', label: 'Unlock', keywords: ['unlocked', 'open', 'padlock'] },
  { name: 'fa-file', code: 'f15b', char: '\u{f15b}', category: 'files', label: 'File', keywords: ['document'] },
  { name: 'md-file_outline', code: 'f0224', char: '\u{f0224}', category: 'files', label: 'File (outline)', keywords: ['document'] },
  { name: 'md-file_code', code: 'f022e', char: '\u{f022e}', category: 'files', label: 'Code file', keywords: ['source', 'script'] },
  { name: 'fa-gear', code: 'f013', char: '\u{f013}', category: 'files', label: 'Gear', keywords: ['cog', 'settings', 'config'] },
  { name: 'md-file_cog', code: 'f107b', char: '\u{f107b}', category: 'files', label: 'Config file', keywords: ['settings', 'configuration', 'dotfile'] },
  { name: 'md-tune', code: 'f062e', char: '\u{f062e}', category: 'files', label: 'Tune', keywords: ['sliders', 'settings', 'config', 'options'] },
  { name: 'fa-wrench', code: 'f0ad', char: '\u{f0ad}', category: 'files', label: 'Wrench', keywords: ['tool', 'settings', 'fix'] },
  { name: 'fa-archive', code: 'f187', char: '\u{f187}', category: 'files', label: 'Archive', keywords: ['box', 'backup', 'tar'] },
  { name: 'md-zip_box', code: 'f05c4', char: '\u{f05c4}', category: 'files', label: 'Zip archive', keywords: ['compressed', 'tar'] },
  { name: 'fa-trash', code: 'f1f8', char: '\u{f1f8}', category: 'files', label: 'Trash', keywords: ['delete', 'bin', 'remove'] },
  { name: 'oct-file_symlink_file', code: 'f481', char: '\u{f481}', category: 'files', label: 'Symlink', keywords: ['link', 'shortcut', 'symbolic'] },
  // status
  { name: 'fa-check', code: 'f00c', char: '\u{f00c}', category: 'status', label: 'Check', keywords: ['ok', 'success', 'done', 'tick'] },
  { name: 'md-check', code: 'f012c', char: '\u{f012c}', category: 'status', label: 'Check (thin)', keywords: ['ok', 'success', 'done', 'tick'] },
  { name: 'fa-check_circle', code: 'f058', char: '\u{f058}', category: 'status', label: 'Check circle', keywords: ['ok', 'success', 'passed'] },
  { name: 'md-check_circle_outline', code: 'f05e1', char: '\u{f05e1}', category: 'status', label: 'Check circle (outline)', keywords: ['ok', 'success', 'passed'] },
  { name: 'fa-xmark', code: 'f00d', char: '\u{f00d}', category: 'status', label: 'Close (X)', keywords: ['x', 'error', 'fail', 'cross', 'times'] },
  { name: 'md-close', code: 'f0156', char: '\u{f0156}', category: 'status', label: 'Close (thin X)', keywords: ['x', 'error', 'fail', 'cross'] },
  { name: 'fa-times_circle', code: 'f057', char: '\u{f057}', category: 'status', label: 'X circle', keywords: ['error', 'fail', 'cross'] },
  { name: 'md-close_circle_outline', code: 'f015a', char: '\u{f015a}', category: 'status', label: 'X circle (outline)', keywords: ['error', 'fail', 'cross'] },
  { name: 'fa-warning', code: 'f071', char: '\u{f071}', category: 'status', label: 'Warning', keywords: ['alert', 'caution', 'triangle', 'exclamation'] },
  { name: 'md-alert_outline', code: 'f002a', char: '\u{f002a}', category: 'status', label: 'Warning (outline)', keywords: ['alert', 'caution', 'triangle'] },
  { name: 'fa-exclamation_circle', code: 'f06a', char: '\u{f06a}', category: 'status', label: 'Error / alert', keywords: ['exclamation', 'failure'] },
  { name: 'fa-info_circle', code: 'f05a', char: '\u{f05a}', category: 'status', label: 'Info', keywords: ['information', 'about'] },
  { name: 'md-information_outline', code: 'f02fd', char: '\u{f02fd}', category: 'status', label: 'Info (outline)', keywords: ['information', 'about'] },
  { name: 'fa-question_circle', code: 'f059', char: '\u{f059}', category: 'status', label: 'Question', keywords: ['help', 'unknown', 'untracked'] },
  { name: 'md-cancel', code: 'f073a', char: '\u{f073a}', category: 'status', label: 'Prohibited', keywords: ['cancel', 'blocked', 'denied', 'forbidden'] },
  { name: 'fa-bug', code: 'f188', char: '\u{f188}', category: 'status', label: 'Bug', keywords: ['debug', 'issue'] },
  { name: 'fa-bolt', code: 'f0e7', char: '\u{f0e7}', category: 'status', label: 'Lightning bolt', keywords: ['flash', 'zap', 'power', 'fast'] },
  { name: 'md-lightning_bolt', code: 'f140b', char: '\u{f140b}', category: 'status', label: 'Lightning bolt (thin)', keywords: ['flash', 'zap', 'power'] },
  { name: 'fa-fire', code: 'f06d', char: '\u{f06d}', category: 'status', label: 'Fire', keywords: ['flame', 'hot', 'lit'] },
  { name: 'fa-star', code: 'f005', char: '\u{f005}', category: 'status', label: 'Star', keywords: ['favorite'] },
  { name: 'md-star_outline', code: 'f04d2', char: '\u{f04d2}', category: 'status', label: 'Star (outline)', keywords: ['favorite'] },
  { name: 'fa-heart', code: 'f004', char: '\u{f004}', category: 'status', label: 'Heart', keywords: ['love', 'like'] },
  { name: 'fa-skull', code: 'ee15', char: '\u{ee15}', category: 'status', label: 'Skull', keywords: ['dead', 'danger', 'root'] },
  { name: 'md-skull_crossbones', code: 'f0bc6', char: '\u{f0bc6}', category: 'status', label: 'Skull and crossbones', keywords: ['danger', 'poison', 'pirate'] },
  { name: 'fa-ghost', code: 'eefe', char: '\u{eefe}', category: 'status', label: 'Ghost', keywords: ['boo', 'spooky'] },
  { name: 'fa-shield', code: 'f132', char: '\u{f132}', category: 'status', label: 'Shield', keywords: ['security', 'protect'] },
  { name: 'md-shield_check', code: 'f0565', char: '\u{f0565}', category: 'status', label: 'Shield (check)', keywords: ['security', 'secure', 'verified'] },
  { name: 'fa-bell', code: 'f0f3', char: '\u{f0f3}', category: 'status', label: 'Bell', keywords: ['notification', 'alert'] },
  { name: 'md-bell_ring', code: 'f009e', char: '\u{f009e}', category: 'status', label: 'Bell (ringing)', keywords: ['notification', 'alert'] },
  { name: 'fa-flag', code: 'f024', char: '\u{f024}', category: 'status', label: 'Flag', keywords: ['mark'] },
  { name: 'fa-flag_checkered', code: 'f11e', char: '\u{f11e}', category: 'status', label: 'Checkered flag', keywords: ['finish', 'done', 'race'] },
  // time
  { name: 'md-clock', code: 'f0954', char: '\u{f0954}', category: 'time', label: 'Clock', keywords: ['time', 'hour'] },
  { name: 'fa-clock', code: 'f017', char: '\u{f017}', category: 'time', label: 'Clock (outline)', keywords: ['time', 'hour'] },
  { name: 'md-clock_fast', code: 'f0152', char: '\u{f0152}', category: 'time', label: 'Clock (fast)', keywords: ['duration', 'elapsed', 'took', 'time'] },
  { name: 'fa-calendar', code: 'f073', char: '\u{f073}', category: 'time', label: 'Calendar', keywords: ['date', 'day', 'month'] },
  { name: 'fa-calendar_check', code: 'f274', char: '\u{f274}', category: 'time', label: 'Calendar (check)', keywords: ['date', 'scheduled'] },
  { name: 'md-calendar_clock', code: 'f00f0', char: '\u{f00f0}', category: 'time', label: 'Calendar (clock)', keywords: ['date', 'time', 'datetime'] },
  { name: 'fa-hourglass_half', code: 'f252', char: '\u{f252}', category: 'time', label: 'Hourglass', keywords: ['wait', 'pending', 'duration'] },
  { name: 'md-timer_outline', code: 'f051b', char: '\u{f051b}', category: 'time', label: 'Timer', keywords: ['duration', 'elapsed', 'countdown'] },
  { name: 'fa-stopwatch', code: 'f2f2', char: '\u{f2f2}', category: 'time', label: 'Stopwatch', keywords: ['duration', 'elapsed', 'took'] },
  { name: 'fa-history', code: 'f1da', char: '\u{f1da}', category: 'time', label: 'History', keywords: ['recent', 'undo', 'time'] },
  { name: 'md-alarm', code: 'f0020', char: '\u{f0020}', category: 'time', label: 'Alarm clock', keywords: ['time', 'reminder', 'wake'] },
  // arrows
  { name: 'fa-chevron_right', code: 'f054', char: '\u{f054}', category: 'arrows', label: 'Chevron right', keywords: ['prompt', 'next'] },
  { name: 'fa-chevron_left', code: 'f053', char: '\u{f053}', category: 'arrows', label: 'Chevron left', keywords: ['back'] },
  { name: 'fa-chevron_up', code: 'f077', char: '\u{f077}', category: 'arrows', label: 'Chevron up', keywords: ['collapse'] },
  { name: 'fa-chevron_down', code: 'f078', char: '\u{f078}', category: 'arrows', label: 'Chevron down', keywords: ['expand'] },
  { name: 'md-chevron_double_right', code: 'f013e', char: '\u{f013e}', category: 'arrows', label: 'Double chevron right', keywords: ['prompt', 'fast forward'] },
  { name: 'md-chevron_triple_right', code: 'f0dbb', char: '\u{f0dbb}', category: 'arrows', label: 'Triple chevron right', keywords: ['prompt'] },
  { name: 'fa-angle_right', code: 'f105', char: '\u{f105}', category: 'arrows', label: 'Angle right', keywords: ['prompt', 'chevron', 'greater than'] },
  { name: 'fa-arrow_right', code: 'f061', char: '\u{f061}', category: 'arrows', label: 'Arrow right', keywords: ['next', 'prompt'] },
  { name: 'fa-arrow_left', code: 'f060', char: '\u{f060}', category: 'arrows', label: 'Arrow left', keywords: ['back'] },
  { name: 'fa-arrow_up', code: 'f062', char: '\u{f062}', category: 'arrows', label: 'Arrow up', keywords: ['ahead', 'push', 'upload'] },
  { name: 'fa-arrow_down', code: 'f063', char: '\u{f063}', category: 'arrows', label: 'Arrow down', keywords: ['behind', 'pull', 'download'] },
  { name: 'md-arrow_up_bold', code: 'f0737', char: '\u{f0737}', category: 'arrows', label: 'Arrow up (bold)', keywords: ['ahead', 'push'] },
  { name: 'md-arrow_down_bold', code: 'f072e', char: '\u{f072e}', category: 'arrows', label: 'Arrow down (bold)', keywords: ['behind', 'pull'] },
  { name: 'fa-long_arrow_right', code: 'f178', char: '\u{f178}', category: 'arrows', label: 'Long arrow right', keywords: ['prompt', 'next'] },
  { name: 'fa-caret_right', code: 'f0da', char: '\u{f0da}', category: 'arrows', label: 'Caret right', keywords: ['triangle', 'prompt'] },
  { name: 'fa-caret_up', code: 'f0d8', char: '\u{f0d8}', category: 'arrows', label: 'Caret up', keywords: ['triangle', 'ahead'] },
  { name: 'fa-caret_down', code: 'f0d7', char: '\u{f0d7}', category: 'arrows', label: 'Caret down', keywords: ['triangle', 'behind'] },
  { name: 'fa-play', code: 'f04b', char: '\u{f04b}', category: 'arrows', label: 'Play', keywords: ['triangle', 'run', 'start'] },
  { name: 'md-menu_right', code: 'f035f', char: '\u{f035f}', category: 'arrows', label: 'Triangle right', keywords: ['caret', 'prompt', 'pointer'] },
  { name: 'md-keyboard_return', code: 'f0311', char: '\u{f0311}', category: 'arrows', label: 'Return', keywords: ['enter', 'newline'] },
  { name: 'md-subdirectory_arrow_right', code: 'f060d', char: '\u{f060d}', category: 'arrows', label: 'Down-right arrow', keywords: ['corner', 'second line', 'newline', 'continuation'] },
  { name: 'md-arrow_up_down', code: 'f0e79', char: '\u{f0e79}', category: 'arrows', label: 'Up/down arrows', keywords: ['diverged', 'ahead', 'behind', 'sync'] },
  // system
  { name: 'oct-cpu', code: 'f4bc', char: '\u{f4bc}', category: 'system', label: 'CPU', keywords: ['processor', 'chip', 'load'] },
  { name: 'fa-microchip', code: 'f2db', char: '\u{f2db}', category: 'system', label: 'Microchip', keywords: ['cpu', 'processor', 'chip'] },
  { name: 'fa-memory', code: 'efc5', char: '\u{efc5}', category: 'system', label: 'Memory (RAM)', keywords: ['ram', 'mem'] },
  { name: 'md-harddisk', code: 'f02ca', char: '\u{f02ca}', category: 'system', label: 'Hard disk', keywords: ['disk', 'storage', 'hdd', 'drive'] },
  { name: 'fa-server', code: 'f233', char: '\u{f233}', category: 'system', label: 'Server', keywords: ['host', 'rack'] },
  { name: 'fa-database', code: 'f1c0', char: '\u{f1c0}', category: 'system', label: 'Database', keywords: ['db', 'sql', 'storage'] },
  { name: 'fa-network_wired', code: 'ef09', char: '\u{ef09}', category: 'system', label: 'Network', keywords: ['lan', 'wired', 'topology'] },
  { name: 'fa-sitemap', code: 'f0e8', char: '\u{f0e8}', category: 'system', label: 'Sitemap', keywords: ['network', 'tree', 'hierarchy', 'topology'] },
  { name: 'md-ip_network', code: 'f0a60', char: '\u{f0a60}', category: 'system', label: 'IP address', keywords: ['ip', 'network'] },
  { name: 'md-ethernet', code: 'f0200', char: '\u{f0200}', category: 'system', label: 'Ethernet', keywords: ['lan', 'port', 'wired', 'rj45'] },
  { name: 'fa-wifi', code: 'f1eb', char: '\u{f1eb}', category: 'system', label: 'Wi-Fi', keywords: ['wifi', 'wireless', 'wlan', 'network'] },
  { name: 'md-wifi_off', code: 'f05aa', char: '\u{f05aa}', category: 'system', label: 'Wi-Fi off', keywords: ['wifi', 'offline', 'disconnected', 'wireless'] },
  { name: 'fa-signal', code: 'f012', char: '\u{f012}', category: 'system', label: 'Signal', keywords: ['strength', 'bars', 'cellular'] },
  { name: 'md-ssh', code: 'f08c0', char: '\u{f08c0}', category: 'system', label: 'SSH', keywords: ['remote', 'secure shell', 'connection'] },
  { name: 'cod-remote', code: 'eb3a', char: '\u{eb3a}', category: 'system', label: 'Remote', keywords: ['ssh', 'connection', 'lan'] },
  { name: 'fa-battery_full', code: 'f240', char: '\u{f240}', category: 'system', label: 'Battery (full)', keywords: ['power', '100'] },
  { name: 'fa-battery_three_quarters', code: 'f241', char: '\u{f241}', category: 'system', label: 'Battery (three quarters)', keywords: ['power', '75'] },
  { name: 'fa-battery_half', code: 'f242', char: '\u{f242}', category: 'system', label: 'Battery (half)', keywords: ['power', '50'] },
  { name: 'fa-battery_quarter', code: 'f243', char: '\u{f243}', category: 'system', label: 'Battery (quarter)', keywords: ['power', 'low', '25'] },
  { name: 'fa-battery_empty', code: 'f244', char: '\u{f244}', category: 'system', label: 'Battery (empty)', keywords: ['power', 'critical', '0'] },
  { name: 'md-battery_charging', code: 'f0084', char: '\u{f0084}', category: 'system', label: 'Battery (charging)', keywords: ['power', 'charger', 'ac'] },
  { name: 'fa-plug', code: 'f1e6', char: '\u{f1e6}', category: 'system', label: 'Plug', keywords: ['ac', 'power', 'plugged in', 'charging'] },
  { name: 'fa-power_off', code: 'f011', char: '\u{f011}', category: 'system', label: 'Power', keywords: ['shutdown', 'off', 'on'] },
  { name: 'md-gauge', code: 'f029a', char: '\u{f029a}', category: 'system', label: 'Gauge', keywords: ['load', 'speed', 'meter', 'performance'] },
  { name: 'fa-user', code: 'f007', char: '\u{f007}', category: 'system', label: 'User', keywords: ['person', 'account', 'whoami'] },
  { name: 'fa-users', code: 'f0c0', char: '\u{f0c0}', category: 'system', label: 'Users', keywords: ['group', 'people', 'team'] },
  { name: 'fa-user_secret', code: 'f21b', char: '\u{f21b}', category: 'system', label: 'Secret agent', keywords: ['hacker', 'spy', 'user-secret'] },
  { name: 'md-incognito', code: 'f05f9', char: '\u{f05f9}', category: 'system', label: 'Incognito', keywords: ['private', 'hacker', 'anonymous'] },
  { name: 'fa-user_shield', code: 'edcf', char: '\u{edcf}', category: 'system', label: 'Admin user', keywords: ['root', 'sudo', 'superuser'] },
  { name: 'fa-key', code: 'f084', char: '\u{f084}', category: 'system', label: 'Key', keywords: ['password', 'auth', 'ssh-key', 'secret'] },
  { name: 'fa-cloud', code: 'f0c2', char: '\u{f0c2}', category: 'system', label: 'Cloud', keywords: ['remote', 'online'] },
  { name: 'fa-globe', code: 'f0ac', char: '\u{f0ac}', category: 'system', label: 'Globe', keywords: ['world', 'internet', 'web', 'earth'] },
  { name: 'md-console', code: 'f018d', char: '\u{f018d}', category: 'system', label: 'Terminal window', keywords: ['terminal', 'console', 'shell'] },
  { name: 'fa-desktop', code: 'f108', char: '\u{f108}', category: 'system', label: 'Desktop', keywords: ['computer', 'monitor', 'pc'] },
  { name: 'md-monitor', code: 'f0379', char: '\u{f0379}', category: 'system', label: 'Monitor', keywords: ['display', 'screen'] },
  { name: 'fa-laptop', code: 'f109', char: '\u{f109}', category: 'system', label: 'Laptop', keywords: ['computer', 'notebook'] },
  // misc
  { name: 'fa-rocket', code: 'f135', char: '\u{f135}', category: 'misc', label: 'Rocket', keywords: ['launch', 'deploy', 'ship', 'fast'] },
  { name: 'fa-coffee', code: 'f0f4', char: '\u{f0f4}', category: 'misc', label: 'Coffee', keywords: ['cup', 'java', 'break'] },
  { name: 'fa-mug_hot', code: 'ef59', char: '\u{ef59}', category: 'misc', label: 'Hot mug', keywords: ['coffee', 'tea', 'cup'] },
  { name: 'fa-music', code: 'f001', char: '\u{f001}', category: 'misc', label: 'Music', keywords: ['note', 'song', 'audio'] },
  { name: 'fa-hashtag', code: 'f292', char: '\u{f292}', category: 'misc', label: 'Hashtag', keywords: ['hash', 'pound', 'number'] },
  { name: 'fa-flask', code: 'f0c3', char: '\u{f0c3}', category: 'misc', label: 'Flask', keywords: ['beaker', 'lab', 'test', 'experiment', 'science'] },
  { name: 'md-package_variant_closed', code: 'f03d7', char: '\u{f03d7}', category: 'misc', label: 'Package', keywords: ['box', 'version', 'release'] },
  { name: 'fa-cube', code: 'f1b2', char: '\u{f1b2}', category: 'misc', label: 'Cube', keywords: ['block', '3d', 'container'] },
  { name: 'md-layers', code: 'f0328', char: '\u{f0328}', category: 'misc', label: 'Layers', keywords: ['stack'] },
  { name: 'fa-code', code: 'f121', char: '\u{f121}', category: 'misc', label: 'Code', keywords: ['brackets', 'html', 'source', 'dev'] },
  { name: 'md-code_braces', code: 'f0169', char: '\u{f0169}', category: 'misc', label: 'Code braces', keywords: ['curly', 'json', 'object'] },
  { name: 'fa-terminal', code: 'f120', char: '\u{f120}', category: 'misc', label: 'Terminal prompt', keywords: ['shell', 'console', 'command line', 'cli'] },
  { name: 'md-lambda', code: 'f0627', char: '\u{f0627}', category: 'misc', label: 'Lambda', keywords: ['function', 'serverless'] },
  { name: 'md-infinity', code: 'f06e4', char: '\u{f06e4}', category: 'misc', label: 'Infinity', keywords: ['loop', 'forever'] },
  { name: 'md-creation', code: 'f0674', char: '\u{f0674}', category: 'misc', label: 'Sparkles', keywords: ['magic', 'new', 'shine', 'ai'] },
  { name: 'md-auto_fix', code: 'f0068', char: '\u{f0068}', category: 'misc', label: 'Magic wand', keywords: ['magic', 'auto fix', 'sparkles'] },
  { name: 'fa-leaf', code: 'f06c', char: '\u{f06c}', category: 'misc', label: 'Leaf', keywords: ['nature', 'eco', 'green'] },
  { name: 'fa-tree', code: 'f1bb', char: '\u{f1bb}', category: 'misc', label: 'Tree', keywords: ['nature', 'forest', 'pine'] },
  { name: 'fa-moon', code: 'f186', char: '\u{f186}', category: 'misc', label: 'Moon', keywords: ['night', 'dark', 'crescent'] },
  { name: 'md-weather_night', code: 'f0594', char: '\u{f0594}', category: 'misc', label: 'Moon and stars', keywords: ['night', 'dark'] },
  { name: 'md-white_balance_sunny', code: 'f05a8', char: '\u{f05a8}', category: 'misc', label: 'Sun', keywords: ['day', 'light', 'sunny'] },
  { name: 'fa-cat', code: 'eeed', char: '\u{eeed}', category: 'misc', label: 'Cat', keywords: ['kitty', 'meow', 'pet'] },
  { name: 'fa-paw', code: 'f1b0', char: '\u{f1b0}', category: 'misc', label: 'Paw', keywords: ['pet', 'animal', 'dog', 'cat'] },
  { name: 'fa-dragon', code: 'eef8', char: '\u{eef8}', category: 'misc', label: 'Dragon', keywords: ['fantasy', 'kali'] },
  { name: 'fa-robot', code: 'ee0d', char: '\u{ee0d}', category: 'misc', label: 'Robot', keywords: ['bot', 'ai', 'automation'] },
  { name: 'fa-crown', code: 'edeb', char: '\u{edeb}', category: 'misc', label: 'Crown', keywords: ['king', 'root', 'admin'] },
  { name: 'md-diamond_stone', code: 'f01c8', char: '\u{f01c8}', category: 'misc', label: 'Diamond', keywords: ['gem', 'jewel'] },
  { name: 'fa-gem', code: 'f219', char: '\u{f219}', category: 'misc', label: 'Gem', keywords: ['diamond', 'jewel', 'ruby'] },
  { name: 'fa-anchor', code: 'f13d', char: '\u{f13d}', category: 'misc', label: 'Anchor', keywords: ['harbor', 'sail', 'helm'] },
  { name: 'md-alien', code: 'f089a', char: '\u{f089a}', category: 'misc', label: 'Alien', keywords: ['ufo', 'space', 'et'] },
];

/**
 * os-release ID (and 'macos') → glyph char, for an OS icon prompt element.
 * Every key has a dedicated glyph; use `OS_ICONS.linux` (Tux) for unknown IDs.
 */
export const OS_ICONS: Record<string, string> = {
  linux: '\u{f31a}', // linux-tux
  macos: '\u{f179}', // fa-apple
  rhel: '\u{ef5d}', // fa-redhat
  rocky: '\u{f32b}', // linux-rocky_linux
  almalinux: '\u{f31d}', // linux-almalinux
  centos: '\u{f304}', // linux-centos
  fedora: '\u{f30a}', // linux-fedora
  ubuntu: '\u{f31b}', // linux-ubuntu
  debian: '\u{f306}', // linux-debian
  arch: '\u{f303}', // linux-archlinux
  manjaro: '\u{f312}', // linux-manjaro
  alpine: '\u{f300}', // linux-alpine
  opensuse: '\u{f314}', // linux-opensuse
  'opensuse-leap': '\u{f37e}', // linux-leap
  'opensuse-tumbleweed': '\u{f37d}', // linux-tumbleweed
  gentoo: '\u{f30d}', // linux-gentoo
  linuxmint: '\u{f30e}', // linux-linuxmint
  nixos: '\u{f313}', // linux-nixos
  raspbian: '\u{f315}', // linux-raspberry_pi
  kali: '\u{f327}', // linux-kali_linux
  void: '\u{f32e}', // linux-void
  elementary: '\u{f309}', // linux-elementary
  pop: '\u{f32a}', // linux-pop_os
  endeavouros: '\u{f322}', // linux-endeavour
  amzn: '\u{f270}', // fa-amazon
  freebsd: '\u{f30c}', // linux-freebsd
  windows: '\u{f17a}', // fa-windows
  android: '\u{f17b}', // fa-android
  openbsd: '\u{f328}', // linux-openbsd
  nobara: '\u{f380}', // linux-nobara
  zorin: '\u{f32f}', // linux-zorin
  deepin: '\u{f321}', // linux-deepin
  parrot: '\u{f329}', // linux-parrot
  garuda: '\u{f337}', // linux-garuda
  artix: '\u{f31f}', // linux-artix
  cachyos: '\u{f385}', // linux-cachyos
  slackware: '\u{f318}', // linux-slackware
};
