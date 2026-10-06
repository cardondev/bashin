/** Install helpers for generated prompts. */
import type { Shell } from './gen/shell';

export function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'prompt';
}

export function installer(code: string, shell: Shell): string {
  const rc = shell === 'zsh' ? '~/.zshrc' : '~/.bashrc';
  const file = `~/.config/bashin/prompt.${shell}`;
  return `# Bashin installer: saves the prompt to ${file} and loads it from ${rc}.
# Paste into a terminal. Run it again any time to update the prompt.
mkdir -p ~/.config/bashin
cat > ${file} <<'__BASHIN__'
${code.trimEnd()}
__BASHIN__
grep -qs 'bashin/prompt.${shell}' ${rc} ||
  printf '\\n# Bashin prompt\\n[ -f %s ] && . %s\\n' "${file}" "${file}" >> ${rc}
. ${file}
`;
}
