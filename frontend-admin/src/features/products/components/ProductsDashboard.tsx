import { SearchBox } from "../../../components/Form/SearchBox";
import { CategorySelectBox } from "../../../components/Form/CategorySelectBox";
import { SortSelectBox } from "../../../components/Form/SortSelectBox";
import { useState, ChangeEvent, useMemo } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useSearchProductMutation } from "../api/searchProduct";
import { useGetAllProductsQuery } from "../api/getAllProducts";
import { useGetAllProductsAdminQuery } from "../api/getAllProductsAdmin";
import { useGetProductsByCategoryQuery } from "../api/getProductsByCategory";
import { sortProductsByPriceAscending, sortProductsByPriceDescending } from "../../../utils/sortProductsByDate";
import { ProductPreview } from "./ProductPreview";
import AdminProductPreview from "./AdminProductPreview";
import { Spinner } from "../../misc/components/Spinner";
import { useAuth } from "../../../context/AuthContext";

type Props = { isAdmin?: boolean; showHidden?: boolean };


export default function ProductsDashboard(props: Props){
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number>();
  const [sortOption, setSortOption] = useState<"PRICE_ASC" | "PRICE_DESC" | "DEFAULT">("DEFAULT");
  // Local toggle for showing hidden products (admin only UI control)
  const [showHiddenLocal, setShowHiddenLocal] = useState(false);
  const showHidden = props.showHidden ?? showHiddenLocal;

  const { mutate, data: searchResults } = useSearchProductMutation();
  const debouncedSearch = useDebounce(() => { mutate(searchQuery); }, 500);

  const handleSearchQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    debouncedSearch();
  };
  const handleSelectCategory = (event: ChangeEvent<HTMLSelectElement>) => setSelectedCategory(Number(event.target.value));

  return (
    <>
      <div className="flex w-full flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between space-y-4 sm:space-y-0 mb-8">
        <div className="flex items-center w-full sm:w-auto">
          <SearchBox searchQuery={searchQuery} handleSearchQueryChange={handleSearchQueryChange} />
          {props.isAdmin && (
            <label className="ml-3 text-sm inline-flex items-center select-none">
              <input
                type="checkbox"
                className="mr-2"
                checked={showHidden}
                onChange={(e) => setShowHiddenLocal(e.target.checked)}
              />
              Show deleted
            </label>
          )}
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-fit">
          <CategorySelectBox selectedCategory={selectedCategory} handleSelectCategory={handleSelectCategory} />
          <SortSelectBox sortOption={sortOption} setSortOption={setSortOption} />
        </div>
      </div>
      <ProductsGrid isAdmin={props.isAdmin} showHidden={showHidden} selectedCategory={selectedCategory} searchQuery={searchQuery} searchResults={searchResults} sortOption={sortOption} />
    </>
  )
}

type ProductsGridProps = {
  selectedCategory?: number;
  searchQuery?: string;
  sortOption: "PRICE_ASC" | "PRICE_DESC" | "DEFAULT";
  searchResults?: IProduct[];
  isAdmin?: boolean;
  showHidden?: boolean;
}

const ProductsGrid = (props: ProductsGridProps) => {
  const { token } = useAuth();
  const allProductsQuery = useGetAllProductsQuery();
  const allProductsAdminQuery = useGetAllProductsAdminQuery(token, Boolean(props.isAdmin && props.showHidden));
  const filteredProductsQuery = useGetProductsByCategoryQuery(props.selectedCategory);

  const productsComponent = useMemo(() => {
    let products: any = null;
    const source = props.isAdmin && props.showHidden ? allProductsAdminQuery.data : allProductsQuery.data;
    if (!source) return products;
    products = [...source];
    // When showing deleted, only include HIDDEN; otherwise only ACTIVE
    if (props.isAdmin && props.showHidden) {
      products = products.filter((p: any) => p.status === 'HIDDEN');
    } else {
      products = products.filter((p: any) => p.status !== 'HIDDEN');
    }
    if (props.searchResults && props.searchQuery !== "") products = [...props.searchResults];
    if (props.selectedCategory && props.selectedCategory !== 0 && filteredProductsQuery.data) {
      if (props.searchResults && props.searchQuery !== "") {
        products = products.filter((product: IProduct) => filteredProductsQuery.data?.some((f: IProduct) => f.id === product.id));
      } else {
        products = [...filteredProductsQuery.data];
      }
    }
    if (props.sortOption === "PRICE_ASC") sortProductsByPriceAscending(products);
    else if (props.sortOption === "PRICE_DESC") sortProductsByPriceDescending(products);
    return products.map((product: IProduct) => props.isAdmin ? <AdminProductPreview key={product.id} {...product} /> : <ProductPreview key={product.id} {...product} />);
  }, [allProductsQuery.data, allProductsAdminQuery.data, filteredProductsQuery.data, props.searchResults, props.selectedCategory, props.sortOption, props.showHidden, props.isAdmin]);

  if (allProductsQuery.isLoading) return <Spinner />;
  if (!allProductsQuery.isSuccess) return null;
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${props.isAdmin ? "py-8 border-gray-500 border-t border-b" : ""}`}>
      {productsComponent}
    </div>
  )
}
