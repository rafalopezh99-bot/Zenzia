// Se muestra al instante en cuanto se hace clic en un enlace del panel,
// mientras la página nueva pide sus datos en el servidor — antes, sin este
// archivo, la pantalla se quedaba congelada con la anterior (o en blanco)
// todo ese tiempo, que es lo que se notaba como lentitud al cambiar de
// página. Next.js lo detecta solo por el nombre del archivo (convención de
// loading.tsx) y lo pinta mientras el resto del árbol hace streaming.
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
    </div>
  );
}
