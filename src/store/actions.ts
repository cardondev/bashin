/**
 * Editor actions shared by several components.
 */
import { toast } from 'sonner';
import { cloneDoc } from '../lib/doc';
import type { ElementType, PromptDoc } from '../lib/model';
import { undo, usePrompt } from './prompt';
import { useUI } from './ui';

/** Add an element after the selection (or at the end) and select it. */
export function addElement(type: ElementType) {
  const { doc, insert } = usePrompt.getState();
  const { selectedId, select } = useUI.getState();
  const i = selectedId ? doc.elements.findIndex((e) => e.id === selectedId) : -1;
  const id = insert(type, i >= 0 ? i + 1 : undefined);
  if (type !== 'newline') select(id);
}

export function loadDoc(doc: PromptDoc, name: string) {
  usePrompt.getState().setDoc(cloneDoc(doc));
  useUI.getState().select(null);
  useUI.getState().setView('builder');
  toast.success(`Loaded “${name}”`, { action: { label: 'Undo', onClick: () => undo() } });
}
