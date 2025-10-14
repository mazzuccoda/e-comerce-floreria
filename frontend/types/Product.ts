export interface Categoria {
  nombre: string;
  slug: string;
  descripcion: string;
  imagen: string | null;
}

export interface TipoFlor {
  id: number;
  nombre: string;
  descripcion: string;
  is_active: boolean;
}

export interface ProductoImagen {
  id: number;
  imagen: string;
  is_primary: boolean;
}

export interface Product {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string;
  descripcion_corta: string;
  categoria: Categoria;
  precio: string;
  precio_descuento: string | null;
  precio_original?: string;
  porcentaje_descuento: number | null;
  precio_final: string;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  envio_gratis?: boolean;
  imagen_principal: string;
  imagenes: ProductoImagen[];
  tipo_flor?: TipoFlor;
  ocasiones?: string[];
  es_adicional?: boolean;
  created_at?: string;
  updated_at?: string;
}
