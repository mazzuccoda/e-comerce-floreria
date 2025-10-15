import ProductListClient from '../components/ProductListClient';

export default function ProductosPage() {
  return (
    <div className="w-full">
      <ProductListClient showFilters={true} />
    </div>
  );
}
