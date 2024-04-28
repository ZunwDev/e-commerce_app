import { FullSidebar, SheetSidebar } from "@/components/dashboard/components";
import { Limit, NoDataFound, PageHeader, ResetFilter, SearchBar } from "@/components/dashboard/global";
import {
  ProductExport,
  ProductFilter,
  ProductSort,
  ProductTable,
  ProductViewToggle,
} from "@/components/dashboard/products/components";
import { User } from "@/components/header";
import { Chip, ChipGroup, ChipGroupContent, ChipGroupTitle } from "@/components/ui/chip";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { NewButton } from "@/components/util";
import { useAdminCheck, useApiData, useSearch } from "@/hooks";
import { fetchFilterData } from "@/lib/api";
import { DEFAULT_LIMIT } from "@/lib/constants";
import { Brand, Category, Checked, Status, initialCheckedState } from "@/lib/interfaces";
import { buildQueryParams, getAmountOfValuesInObjectOfObjects } from "@/lib/utils";
import { PackagePlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDebounce } from "use-debounce";

export default function Products() {
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const { handleSearch, getSearchQueryFromURL } = useSearch(setLocalSearchQuery);
  useAdminCheck();

  // Filter related
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [checked, setChecked] = useState<Checked>(initialCheckedState);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewToggle, setViewToggle] = useState("list");
  const [filterData, setFilterData] = useState({
    category: [] as Category[],
    brand: [] as Brand[],
    status: [] as Status[],
  });
  const filterAmount = useMemo(() => getAmountOfValuesInObjectOfObjects(checked), [checked]);
  const [dbcSearch] = useDebounce(localSearchQuery, 250);

  const productAPIURL = useMemo(() => {
    const pageQueryParam = parseInt(queryParams.get("p")) || 1;
    const searchQuery = dbcSearch !== null && dbcSearch !== "" ? dbcSearch : getSearchQueryFromURL() || "";
    const { brand, category, status } = checked;

    const paramsObj = {
      limit,
      page: pageQueryParam - 1,
      sortBy,
      sortDirection,
      searchQuery,
      brand,
      category,
      status,
    };

    return buildQueryParams(paramsObj);
  }, [checked, limit, sortBy, sortDirection, dbcSearch, queryParams.get("p")]);

  const handleResetFilters = useCallback(() => {
    setChecked(initialCheckedState);
  }, []);

  const { data: pageData, loading: pageLoading, error: pageError } = useApiData("products", productAPIURL, [productAPIURL]);
  const {
    data: amountData,
    loading: amountLoading,
    error: amountError,
  } = useApiData("products/amounts", productAPIURL, [productAPIURL]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch filter data
        const [categoryData, brandData, , statusData] = await fetchFilterData();
        setFilterData({ category: categoryData, brand: brandData, status: statusData });
      } catch (error) {
        console.error("Error fetching filter data:", error.response?.data?.message || error.message);
      }
    };

    fetchData();
  }, [productAPIURL]);

  const handleChipRemove = useCallback(
    (key, idToRemove) => {
      // Update the checked state
      setChecked((prevChecked) => {
        const updatedChecked = { ...prevChecked };
        updatedChecked[key] = updatedChecked[key].filter((id) => id !== idToRemove);
        return updatedChecked;
      });
    },
    [setChecked]
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <FullSidebar />
      <div className="flex flex-col">
        <div className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <SheetSidebar />
          <div className="ml-auto">
            <User />
          </div>
        </div>
        <main className="flex flex-1 flex-col gap-2 p-4 lg:gap-4 lg:p-6 pt-4">
          <div className="flex items-center justify-between px-4 md:px-0">
            <PageHeader title={`Products (${pageData?.totalElements > 0 ? pageData?.totalElements : 0})`} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex md:flex-row flex-wrap md:justify-between items-center xs:px-4 sm:px-0 gap-1.5">
              <div className="flex flex-row gap-1.5">
                <ProductFilter filterAmount={filterAmount} checked={checked} setChecked={setChecked} amountData={amountData} />
                <SearchBar
                  searchQuery={localSearchQuery}
                  type="products"
                  className="md:flex hidden"
                  handleSearch={handleSearch}
                />
              </div>
              <div className="flex flex-row gap-1.5">
                <Limit setLimit={setLimit} limit={limit} type="Products" />
                <ProductSort
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortDirection={sortDirection}
                  setSortDirection={setSortDirection}
                />
                <ProductExport data={pageData?.content} />
                <ProductViewToggle viewToggle={viewToggle} setViewToggle={setViewToggle} />
                {pageData?.totalElements > 0 && <NewButton path="products" icon={<PackagePlus />} type="Product" />}
              </div>
              <SearchBar
                searchQuery={localSearchQuery}
                type="products"
                className="md:hidden flex w-full"
                handleSearch={handleSearch}
              />
            </div>
            {filterAmount > 0 && (
              <ScrollArea className="w-full overflow-y-hidden whitespace-nowrap">
                {Object.entries(checked)
                  .reverse()
                  .map(([key, value], index) => {
                    if (value.length > 0) {
                      return (
                        <ChipGroup key={index}>
                          <ChipGroupTitle>{key.capitalize()}:</ChipGroupTitle>
                          <ChipGroupContent>
                            {value.map((item, index) => (
                              <Chip key={index} onRemove={() => handleChipRemove(key, item)}>
                                {filterData &&
                                  filterData[key]
                                    .filter((filtered) => filtered[key + "Id"] === item)
                                    .map((filteredItem) => filteredItem.name)}
                              </Chip>
                            ))}
                          </ChipGroupContent>
                        </ChipGroup>
                      );
                    }
                    return null;
                  })}
                <ResetFilter onReset={handleResetFilters} filterAmount={filterAmount} />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
          <div
            className={`flex flex-1 ${
              !pageData || Object.keys(pageData)?.length === 0 ? "items-center justify-center" : "items-start w-full"
            } p-4 rounded-lg border-2 border-dashed shadow-sm`}>
            <div className="flex flex-col items-center gap-2 text-center w-full">
              {!pageData || Object.keys(pageData)?.length === 0 ? (
                <>
                  <NoDataFound
                    filterAmount={filterAmount}
                    dbcSearch={dbcSearch}
                    type="products"
                    description="You can start selling as soon as you add a product."
                  />
                  <NewButton path="products" icon={<PackagePlus />} type="Product" className="mt-2" />
                </>
              ) : (
                <ProductTable data={pageData} viewToggle={viewToggle} pageError={pageError} amountError={amountError} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
