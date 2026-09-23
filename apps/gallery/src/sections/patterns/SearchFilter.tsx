import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Chip,
  Empty,
  FilterBar,
  FilterBarActions,
  FilterChips,
  Grid,
  MultiCombobox,
  Pagination,
  SearchIcon,
  SearchInput,
  SegmentedControl,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shining-technologies/ui'
import { useMemo, useState } from 'react'
import { Demo } from '../Demo'

interface Item {
  sku: string
  name: string
  category: string
  warehouse: string
  stock: number
  price: number
}

const CATEGORIES = ['Fasteners', 'Electrical', 'Plumbing', 'Safety', 'Tools']
const WAREHOUSES = ['Sydney', 'Melbourne', 'Brisbane']

// Fixed, not random: the same results on every visit.
const ITEMS: Item[] = Array.from({ length: 34 }, (_, index) => {
  const category = CATEGORIES[index % CATEGORIES.length]!
  const names: Record<string, string[]> = {
    Fasteners: ['Hex bolt M8', 'Wood screw 40mm', 'Wall anchor', 'Rivet 4mm'],
    Electrical: ['Cable tie pack', 'RCD 30mA', 'Conduit 20mm', 'LED batten'],
    Plumbing: ['PVC elbow 50mm', 'Ball valve ½"', 'Thread tape', 'Flexi hose'],
    Safety: ['Hi-vis vest', 'Safety glasses', 'Ear muffs', 'Gloves (L)'],
    Tools: ['Impact driver', 'Stud finder', 'Tape measure 8m', 'Utility knife'],
  }
  const list = names[category]!
  return {
    sku: `SKU-${String(1000 + index * 7)}`,
    name: list[Math.floor(index / CATEGORIES.length) % list.length]!,
    category,
    warehouse: WAREHOUSES[index % WAREHOUSES.length]!,
    stock: (index * 37) % 120,
    price: 3 + ((index * 53) % 240),
  }
})

const PAGE_SIZE = 6
const money = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' })

function SearchPage() {
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [warehouse, setWarehouse] = useState('all')
  const [inStock, setInStock] = useState(false)
  const [sort, setSort] = useState('name')
  const [page, setPage] = useState(1)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const found = ITEMS.filter(
      (item) =>
        (!q || `${item.name} ${item.sku}`.toLowerCase().includes(q)) &&
        (categories.length === 0 || categories.includes(item.category)) &&
        (warehouse === 'all' || item.warehouse === warehouse) &&
        (!inStock || item.stock > 0),
    )
    return [...found].sort((a, b) =>
      sort === 'price' ? a.price - b.price : sort === 'stock' ? b.stock - a.stock : a.name.localeCompare(b.name, 'en'),
    )
  }, [query, categories, warehouse, inStock, sort])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pageCount)
  const shown = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  // Any change to the filters goes back to the first page.
  const refilter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  const clearAll = () => {
    setQuery('')
    setCategories([])
    setWarehouse('all')
    setInStock(false)
    setPage(1)
  }

  return (
    <div className="pattern-frame stack">
      <FilterBar aria-label="Filter the catalogue">
        <SearchInput aria-label="Search the catalogue" placeholder="Name or SKU" value={query} onValueChange={refilter(setQuery)} />
        <div className="pattern-filter">
          <MultiCombobox
            aria-label="Category"
            placeholder="Category"
            options={CATEGORIES.map((category) => ({ value: category, label: category }))}
            value={categories}
            onValueChange={refilter(setCategories)}
          />
        </div>
        <Select value={warehouse} onValueChange={refilter(setWarehouse)}>
          <SelectTrigger aria-label="Warehouse" style={{ width: '10rem' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All warehouses</SelectItem>
            {WAREHOUSES.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Chip selected={inStock} onSelectedChange={refilter(setInStock)}>
          In stock
        </Chip>
        <FilterBarActions>
          <SegmentedControl
            aria-label="Sort by"
            size="sm"
            value={sort}
            onValueChange={setSort}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'price', label: 'Price' },
              { value: 'stock', label: 'Stock' },
            ]}
          />
        </FilterBarActions>
      </FilterBar>

      <FilterChips onClearAll={clearAll}>
        {query ? (
          <Chip onRemove={() => refilter(setQuery)('')} removeLabel="Remove the search">
            “{query}”
          </Chip>
        ) : null}
        {categories.map((category) => (
          <Chip
            key={category}
            onRemove={() => refilter(setCategories)(categories.filter((entry) => entry !== category))}
            removeLabel={`Remove ${category}`}
          >
            Category: {category}
          </Chip>
        ))}
        {warehouse !== 'all' ? (
          <Chip onRemove={() => refilter(setWarehouse)('all')} removeLabel="Remove the warehouse filter">
            Warehouse: {warehouse}
          </Chip>
        ) : null}
        {inStock ? (
          <Chip onRemove={() => refilter(setInStock)(false)} removeLabel="Remove in stock">
            In stock
          </Chip>
        ) : null}
      </FilterChips>

      <p className="muted pattern-count" role="status">
        {results.length} {results.length === 1 ? 'item' : 'items'}
      </p>

      {shown.length ? (
        <Grid minItemWidth="14rem" gap="sm" as="ul">
          {shown.map((item) => (
            <li key={item.sku}>
              <Card variant="flat" interactive>
                <CardHeader>
                  <CardTitle as="h3">{item.name}</CardTitle>
                  <CardDescription>
                    {item.sku} · {item.warehouse}
                  </CardDescription>
                  <div className="pattern-result-meta">
                    <Badge tone={item.stock === 0 ? 'destructive' : item.stock < 20 ? 'warning' : 'success'}>
                      {item.stock === 0 ? 'Out of stock' : `${item.stock} in stock`}
                    </Badge>
                    <strong>{money.format(item.price)}</strong>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </Grid>
      ) : (
        <Card variant="flat">
          <Empty
            icon={<SearchIcon />}
            title="No items match"
            description="Try fewer filters, or search for the SKU."
            actions={
              <Button size="sm" variant="outline" onClick={clearAll}>
                Clear all filters
              </Button>
            }
          />
        </Card>
      )}

      {pageCount > 1 ? <Pagination page={current} pageCount={pageCount} onPageChange={setPage} /> : null}
    </div>
  )
}

export function SearchFilterPattern() {
  return (
    <div className="stack">
      <Demo
        title="Catalogue search"
        note="Search, a multi-select, a select and a toggle on one filter bar, sorting at its end; what is in force as chips; the count announced; results as a grid of cards that reflows; pagination that resets when the filters change; a no-results state that offers the way out."
        inline={false}
        code={`
<FilterBar aria-label="Filter the catalogue">
  <SearchInput aria-label="Search the catalogue" value={query} onValueChange={setQuery} />
  <MultiCombobox aria-label="Category" options={categories} value={picked} onValueChange={setPicked} />
  <Chip selected={inStock} onSelectedChange={setInStock}>In stock</Chip>
  <FilterBarActions>
    <SegmentedControl aria-label="Sort by" options={…} value={sort} onValueChange={setSort} />
  </FilterBarActions>
</FilterBar>
<FilterChips onClearAll={clearAll}>{chips}</FilterChips>
<p role="status">{results.length} items</p>
{results.length
  ? <Grid minItemWidth="14rem" as="ul">{…}</Grid>
  : <Empty title="No items match" actions={<Button onClick={clearAll}>Clear all filters</Button>} />}
<Pagination page={page} pageCount={pageCount} onPageChange={setPage} />`}
      >
        <SearchPage />
      </Demo>
    </div>
  )
}
