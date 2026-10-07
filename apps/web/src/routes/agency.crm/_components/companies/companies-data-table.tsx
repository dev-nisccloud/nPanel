import { useState } from "react";
import { Link } from "react-router";
import {
  Building2,
  Globe,
  Mail,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TagChips, tagRefsFromAssignments } from "../record-tags";
import { CompanyFormSheet } from "./company-form-sheet";
import { DeleteCompanyDialog } from "./delete-company-dialog";

interface CompaniesDataTableProps {
  data: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  isLoading: boolean;
  search: string;
  onSearch: (search: string) => void;
  industry?: string;
  onIndustryChange: (industry?: string) => void;
  size?: string;
  onSizeChange: (size?: string) => void;
  onPageChange: (page: number) => void;
  onRefetch: () => void;
}

export function CompaniesDataTable({
  data,
  pagination,
  isLoading,
  search,
  onSearch,
  industry,
  onIndustryChange,
  size,
  onSizeChange,
  onPageChange,
  onRefetch,
}: CompaniesDataTableProps) {
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [deletingCompany, setDeletingCompany] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Contacts</TableHead>
                <TableHead>Deals</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Search companies..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Deals</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No companies found. Create your first company to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Link
                          to={`/agency/crm/companies/${company.id}`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {company.name}
                        </Link>
                        <TagChips tags={tagRefsFromAssignments(company.tags)} />
                        {company.website && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              {new URL(company.website).hostname}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.industry ? (
                      <Badge variant="secondary">{company.industry}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {company.size || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.contacts?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.deals?.length || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/agency/crm/companies/${company.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCompany(company)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingCompany(company)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasMore}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Sheet */}
      {editingCompany && (
        <CompanyFormSheet
          open={!!editingCompany}
          onOpenChange={(open) => !open && setEditingCompany(null)}
          company={editingCompany}
          onSuccess={() => {
            setEditingCompany(null);
            onRefetch();
          }}
        />
      )}

      {/* Delete Dialog */}
      {deletingCompany && (
        <DeleteCompanyDialog
          open={!!deletingCompany}
          onOpenChange={(open) => !open && setDeletingCompany(null)}
          company={deletingCompany}
          onSuccess={() => {
            setDeletingCompany(null);
            onRefetch();
          }}
        />
      )}
    </div>
  );
}
