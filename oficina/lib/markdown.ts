// Conversor mínimo de Markdown a HTML para las respuestas de los
// departamentos. Escapa todo el HTML primero, así que lo que devuelve es
// seguro para dangerouslySetInnerHTML.

function escapar(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function enLinea(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function filaTabla(linea: string): string[] {
  return linea.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

export function markdownAHtml(md: string): string {
  const lineas = escapar(md).split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lineas.length) {
    const linea = lineas[i];

    if (linea.startsWith("```")) {
      const codigo: string[] = [];
      i++;
      while (i < lineas.length && !lineas[i].startsWith("```")) codigo.push(lineas[i++]);
      i++;
      html.push(`<pre><code>${codigo.join("\n")}</code></pre>`);
      continue;
    }

    const titulo = /^(#{1,4})\s+(.*)$/.exec(linea);
    if (titulo) {
      const n = Math.min(titulo[1].length + 1, 5);
      html.push(`<h${n}>${enLinea(titulo[2])}</h${n}>`);
      i++;
      continue;
    }

    if (/^\s*\|.*\|\s*$/.test(linea) && i + 1 < lineas.length && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lineas[i + 1])) {
      const cab = filaTabla(linea);
      i += 2;
      const filas: string[][] = [];
      while (i < lineas.length && /^\s*\|.*\|\s*$/.test(lineas[i])) filas.push(filaTabla(lineas[i++]));
      html.push(
        `<div class="tabla"><table><thead><tr>${cab.map((c) => `<th>${enLinea(c)}</th>`).join("")}</tr></thead><tbody>${filas
          .map((f) => `<tr>${f.map((c) => `<td>${enLinea(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`,
      );
      continue;
    }

    if (/^\s*([-*]|\d+\.)\s+/.test(linea)) {
      const ordenada = /^\s*\d+\./.test(linea);
      const items: string[] = [];
      while (i < lineas.length && /^\s*([-*]|\d+\.)\s+/.test(lineas[i])) {
        items.push(`<li>${enLinea(lineas[i].replace(/^\s*([-*]|\d+\.)\s+/, ""))}</li>`);
        i++;
      }
      const tag = ordenada ? "ol" : "ul";
      html.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    if (/^\s*&gt;\s?/.test(linea)) {
      const citas: string[] = [];
      while (i < lineas.length && /^\s*&gt;\s?/.test(lineas[i])) citas.push(enLinea(lineas[i++].replace(/^\s*&gt;\s?/, "")));
      html.push(`<blockquote>${citas.join("<br>")}</blockquote>`);
      continue;
    }

    if (/^\s*(---|\*\*\*)\s*$/.test(linea)) {
      html.push("<hr>");
      i++;
      continue;
    }

    if (!linea.trim()) {
      i++;
      continue;
    }

    const parrafo: string[] = [];
    while (
      i < lineas.length &&
      lineas[i].trim() &&
      !/^(#{1,4}\s|```|\s*([-*]|\d+\.)\s+|\s*&gt;|\s*\|)/.test(lineas[i])
    ) {
      parrafo.push(enLinea(lineas[i++]));
    }
    if (parrafo.length) html.push(`<p>${parrafo.join("<br>")}</p>`);
    else html.push(`<p>${enLinea(lineas[i++])}</p>`);
  }

  return html.join("\n");
}
