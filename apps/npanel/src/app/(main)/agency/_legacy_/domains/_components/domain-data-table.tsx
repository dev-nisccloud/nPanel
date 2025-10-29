"use client";

import * as React from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { DataTable as DataTableNew } from "../../../../../../components/data-table/data-table";
import { DataTablePagination } from "../../../../../../components/data-table/data-table-pagination";
import { DataTableViewOptions } from "../../../../../../components/data-table/data-table-view-options";
import { withDndColumn } from "../../../../../../components/data-table/table-utils";

import { domainColumns } from "./domain-columns";
import { domainSchema } from "./domain-schema";
import { DomainSearch } from "./domain-search";
import type { DomainTableState, DomainTableRow } from "@/types/domain";

interface DomainDataTableProps {
  domainData: {
    results: any[];
    total: number;
    limit: number;
    offset: number;
  };
}

export function DomainDataTable({ domainData }: DomainDataTableProps) {
  
  // Table state
  const [tableState, setTableState] = React.useState<DomainTableState>({
    pagination: {
      pageIndex: 0,
      pageSize: 10,
    },
    sorting: [],
    columnFilters: [],
    globalFilter: "",
  });
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [popularityFilter, setPopularityFilter] = React.useState<string>("all");
  
  // Process and filter the domain data for the table
  const processedData = React.useMemo(() => {
    if (!domainData?.results) return [];
    
    // First, transform all the data
    const allData = domainData.results.map((tld: any, index: number) => {
      // Extract registration price (create_price) for table display
      const registrationPrice = tld.prices?.create_price ? {
        product: {
          currency: tld.prices.create_price.product?.currency || 'USD',
          price: tld.prices.create_price.product?.price || 0,
          formatted: `${tld.prices.create_price.product?.currency || 'USD'} ${(tld.prices.create_price.product?.price || 0).toFixed(2)}`
        },
        reseller: {
          currency: tld.prices.create_price.reseller?.currency || 'USD',
          price: tld.prices.create_price.reseller?.price || 0,
          formatted: `${tld.prices.create_price.reseller?.currency || 'USD'} ${(tld.prices.create_price.reseller?.price || 0).toFixed(2)}`
        }
      } : null;

      // Determine status based on available data
      let status: 'active' | 'inactive' | 'premium' | 'restricted' = 'active';
      if (tld.status === 'INACT') {
        status = 'inactive';
      } else if (tld.prices?.reseller_price?.promotion_details) {
        status = 'premium';
      }

      // Determine popularity based on TLD name
      let popularity: 'high' | 'medium' | 'low' = 'low';
      const tldName = tld.name?.toLowerCase();
      if (tldName === '.com' || tldName === '.org' || tldName === '.net') {
        popularity = 'high';
      } else if (tldName === '.info' || tldName === '.biz' || tldName === '.co' || tldName === '.io') {
        popularity = 'medium';
      }

      // Extract restrictions from supported IDN scripts (simplified)
      const restrictions: string[] = [];
      if (tld.supported_idn_scripts && tld.supported_idn_scripts.length > 0) {
        restrictions.push('IDN Supported');
      }
      if (!tld.private_whois_allowed) {
        restrictions.push('No Private WHOIS');
      }

      return {
        id: tld.name || `tld-${index}`,
        extension: tld.name || '',
        displayName: tld.name || '',
        minPeriod: tld.min_period || 1,
        maxPeriod: tld.max_period || 10,
        canTransfer: tld.transfer_available || false,
        canRenew: tld.renew_available || false,
        supportsIdn: !!(tld.supported_idn_scripts && tld.supported_idn_scripts.length > 0),
        supportsDnssec: tld.dnssec_allowed || false,
        requiresAuthCode: tld.is_transfer_auth_code_required || false,
        isPremium: !!(tld.prices?.reseller_price?.promotion_details),
        registrationPrice,
        description: `TLD for ${tld.name} domains`,
        restrictions,
        status,
        popularity,
        lastUpdated: new Date().toISOString(),
        fullDomainData: tld, // Store complete domain data for detailed view
      } as DomainTableRow;
    });

    // Apply client-side filtering
    let filteredData = allData;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = filteredData.filter(domain => 
        domain.extension.toLowerCase().includes(searchLower) ||
        (domain.description || '').toLowerCase().includes(searchLower) ||
        domain.status.toLowerCase().includes(searchLower) ||
        domain.popularity.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filteredData = filteredData.filter(domain => domain.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      if (typeFilter === "premium") {
        filteredData = filteredData.filter(domain => domain.isPremium);
      } else if (typeFilter === "standard") {
        filteredData = filteredData.filter(domain => !domain.isPremium);
      }
    }

    // Popularity filter
    if (popularityFilter !== "all") {
      filteredData = filteredData.filter(domain => domain.popularity === popularityFilter);
    }

    return filteredData;
  }, [domainData, searchTerm, statusFilter, typeFilter, popularityFilter]);

  // State for managing reordered data (exactly like original)
  const [data, setData] = React.useState(() => processedData);
  
  // Update data when processedData changes
  React.useEffect(() => {
    setData(processedData);
  }, [processedData]);
  
  // Table configuration with client-side pagination
  const columns = withDndColumn(domainColumns);
  const table = useDataTableInstance({ 
    data, 
    columns, 
    getRowId: (row) => row.id,
  });
  
  
  
  return (
    <Tabs defaultValue="domains" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor="view-selector" className="sr-only">
            View
          </Label>
          <Select defaultValue="domains">
            <SelectTrigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
              <SelectValue placeholder="Select a view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="domains">Openprovider Domains</SelectItem>
              <SelectItem value="search">Domain Search</SelectItem>
              <SelectItem value="supported">Supported Domains</SelectItem>
            </SelectContent>
          </Select>
          
          <TabsList className="hidden @4xl/main:flex">
            <TabsTrigger value="domains">
              Openprovider Domains
            </TabsTrigger>
            <TabsTrigger value="search">
              Domain Search
            </TabsTrigger>
            <TabsTrigger value="supported">
              Supported Domains
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={popularityFilter} onValueChange={setPopularityFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Popularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <TabsContent value="domains" className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border">
          <DataTableNew 
            dndEnabled
            table={table} 
            columns={columns} 
            onReorder={setData}
          />
        </div>
        <DataTablePagination table={table} />
        
        {/* Data info */}
        {domainData && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}{" "}
              of {data.length} domains
              {searchTerm && (
                <span className="ml-2 text-blue-600">
                  (filtered from {domainData.total} total)
                </span>
              )}
            </div>
            <div>
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="search" className="flex flex-col">
        <DomainSearch />
      </TabsContent>
      
      <TabsContent value="supported" className="flex flex-col">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed">
          <p className="text-center text-muted-foreground mt-8">Supported domains view coming soon</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
