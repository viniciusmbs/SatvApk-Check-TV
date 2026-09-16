import { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

interface CodeViewerProps {
  title: string;
  filename: string;
  code: string;
  language: string;
  description?: string;
}

export function CodeViewer({ title, filename, code, language, description }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback manual copy
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800 gap-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-neutral-200">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
            {filename}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 cursor-pointer"
          title="Copiar código"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Código</span>
            </>
          )}
        </button>
      </div>

      {description && (
        <div className="px-4 py-2 text-xs text-neutral-400 bg-neutral-900/80 border-b border-neutral-800/60">
          {description}
        </div>
      )}

      {/* Code body with line numbers */}
      <div className="p-4 overflow-x-auto max-h-[560px] text-xs font-mono leading-relaxed select-text">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="hover:bg-neutral-800/40">
                <td className="w-10 pr-4 text-right select-none text-neutral-600 font-mono text-[11px] align-top">
                  {index + 1}
                </td>
                <td className="text-neutral-200 whitespace-pre font-mono">
                  {line || ' '}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
