// Forma común de los datos editables de una web (columna `site_content.data`,
// jsonb). Todas las plantillas leen esta misma forma — así el mismo
// formulario del editor (/mi-web) sirve para cualquier plantilla, y añadir
// una plantilla nueva nunca implica tocar el editor ni la base de datos.
export interface SiteData {
  brand?: string;
  heroTitle?: string;
  heroSub?: string;
  heroCta?: string;
  about?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  instagram?: string;
  copyright?: string;
  services?: { name: string; desc: string }[];
}

export interface SiteTemplateProps {
  data: SiteData;
  accentColor: string;
}

export type SiteTemplateComponent = (props: SiteTemplateProps) => JSX.Element;

export interface SiteTemplateDef {
  key: string;
  label: string;
  Component: SiteTemplateComponent;
}
