import { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL, DEFAULT_LIMIT } from "@/lib/constants";
import { Checked, FilterString, Page, initialCheckedState, initialFilterString } from "./interfaces";
import {
  NewProductButton,
  ProductFilter,
  ProductLimit,
  ProductSearch,
  ProductSort,
  ProductTable,
  ResetFilter,
} from "./components";
import { useDebounce } from "use-debounce";
import { debounce, newAbortSignal } from "@/lib/utils";
import PageHeader from "@/components/global/PageHeader";
import { useAdminCheck } from "@/hooks";

export default function Products() {
  useAdminCheck();
  //Filter related
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [filterString, setFilterString] = useState<FilterString>(initialFilterString);
  const [debouncedFilterString, setDebouncedFilterString] = useState<FilterString>(initialFilterString);
  const [filterAmount, setFilterAmount] = useState(0);
  const [checked, setChecked] = useState<Checked>(initialCheckedState);
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [pageData, setPageData] = useState<Page>({} as Page);
  const [searchQuery, setSearchQuery] = useState("");

  //Debounced values
  const [dbcSearch] = useDebounce(searchQuery, 750);
  const [dbcFilterString] = useDebounce(filterString, 250);

  const productAPIURL = useMemo(() => {
    const { brand, category, archived } = dbcFilterString;
    const params = new URLSearchParams({
      limit: limit,
      sortBy: sortBy.slice(0, sortBy.indexOf("_")),
      sortDirection: sortBy.slice(sortBy.indexOf("_") + 1, sortBy.length),
    });
    if (dbcSearch.length > 0) {
      params.append("searchQuery", dbcSearch);
    }
    return `${API_URL}/products?${params.toString()}&${brand}${category}${archived}`;
  }, [dbcFilterString, limit, sortBy, dbcSearch]);

  const handleResetFilters = useCallback(() => {
    setFilterString(initialFilterString);
    setChecked(initialCheckedState);
  }, []);

  const debouncedFetchProducts = useMemo(
    () =>
      debounce(async () => {
        try {
          const response = await axios.get(`${API_URL}/products?limit=${limit}&${productAPIURL}`, {
            signal: newAbortSignal(5000),
          });
          setPageData(response.data);
        } catch (error) {
          console.error("Error fetching products:", error.response?.data?.message || error.message);
          setPageData({} as Page);
        }
      }, 250),
    [limit, productAPIURL]
  );

  useEffect(() => {
    const debouncedFilterString = debounce(filterString, 250);
    if (typeof debouncedFilterString === "object" && debouncedFilterString !== null) {
      setDebouncedFilterString(debouncedFilterString);
    }
  }, [filterString]);

  useEffect(() => {
    debouncedFetchProducts(debouncedFilterString);
  }, [debouncedFetchProducts, debouncedFilterString]);

  return (
    <div className="flex flex-col gap-16 mt-32 px-8 md:min-w-[1600px] min-w-[360px] max-w-[1600px]">
      <div className="md:px-0 px-4 flex justify-between flex-row border-b pb-4 items-center">
        <PageHeader
          title={`Products (${pageData.totalElements > 0 ? pageData.totalElements : 0})`}
          description="Manage products in the store"
        />
        <NewProductButton />
      </div>
      <div className="flex flex-col gap-4">
        <div className="w-full flex flex-row justify-between gap-1 flex-wrap xs:px-4 sm:px-0">
          <div className="flex flex-row gap-1.5">
            <ProductFilter
              setFilterString={setFilterString}
              setFilterAmount={setFilterAmount}
              filterAmount={filterAmount}
              checked={checked}
              setChecked={setChecked}
            />
            <ProductSort sortBy={sortBy} setSortBy={setSortBy} />
            <ProductSearch setSearchQuery={setSearchQuery} />
          </div>
          <div className="flex flex-row gap-1.5 flex-wrap">
            <ResetFilter onReset={handleResetFilters} filterAmount={filterAmount} />
            <ProductLimit setLimit={setLimit} limit={limit} />
          </div>
        </div>
        <ProductTable data={pageData.content} />
      </div>
    </div>
  );
}
