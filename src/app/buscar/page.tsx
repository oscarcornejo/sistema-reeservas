/**
 * @fileoverview Pagina de busqueda publica de negocios.
 * Server Component que carga negocios publicados desde la BD
 * y delega el filtrado interactivo al componente cliente.
 */

import { getCachedPublishedBusinesses } from '@/lib/data/queries';
import { SearchClient, type BusinessResult } from './search-client';

export default async function SearchPage() {
    const businesses = await getCachedPublishedBusinesses();
    return <SearchClient businesses={businesses as unknown as BusinessResult[]} />;
}
