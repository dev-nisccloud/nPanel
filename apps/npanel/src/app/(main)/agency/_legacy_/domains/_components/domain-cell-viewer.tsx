import {
  Globe,
  Shield,
  Lock,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  XIcon
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/npanel-ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { DomainTableRow } from "@/types/domain";

export function DomainCellViewer({ domain }: { domain: DomainTableRow }) {

  // Helper function to format prices safely
  const formatPrice = (price: number | undefined, currency: string | undefined) => {
    if (price === undefined || currency === undefined) {
      return 'N/A';
    }
    return `${currency} ${price.toFixed(2)}`;
  };

  // Helper function to safely get price data
  const getPriceData = (priceObj: any) => {
    return {
      product: {
        price: priceObj?.product?.price ?? 0,
        currency: priceObj?.product?.currency ?? 'USD'
      },
      reseller: {
        price: priceObj?.reseller?.price ?? 0,
        currency: priceObj?.reseller?.currency ?? 'USD'
      }
    };
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {domain.displayName}
        </Button>
      </SheetTrigger>
      <SheetContent 
        // style={{ maxWidth: 647 }}
      >
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">{domain.displayName}</SheetTitle>
              <SheetDescription className="text-base">
                {domain.description}
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="px-1 pb-1">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-8 max-h-[60vh] overflow-y-auto pr-1">
              {/* Status Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div className={`p-1 rounded-full ${domain.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {domain.status === 'active' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      </div>
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={domain.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {domain.status}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Popularity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={domain.popularity === 'high' ? 'default' : 'outline'}
                      className="capitalize"
                    >
                      {domain.popularity}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Features Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Features & Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.supportsIdn ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Globe className="h-4 w-4" />
                        </div>
                        <span className="text-sm">IDN Support</span>
                        {domain.supportsIdn ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.supportsDnssec ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="text-sm">DNSSEC</span>
                        {domain.supportsDnssec ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.requiresAuthCode ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Lock className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Auth Code Required</span>
                        {domain.requiresAuthCode ? <CheckCircle className="h-4 w-4 text-orange-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${domain.isPremium ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Star className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Premium Domain</span>
                        {domain.isPremium ? <CheckCircle className="h-4 w-4 text-yellow-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Periods */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Registration Periods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{domain.minPeriod}</div>
                      <div className="text-sm text-muted-foreground">Min Years</div>
                    </div>
                    <div className="text-muted-foreground">to</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{domain.maxPeriod}</div>
                      <div className="text-sm text-muted-foreground">Max Years</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 mt-8 max-h-[60vh] overflow-y-auto pr-1">
              {domain.fullDomainData?.prices ? (
                <div className="space-y-6">
                  {/* Main Reseller Price - Hero Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Reseller Pricing</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Current wholesale pricing</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retail Price</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(domain.fullDomainData.prices.reseller_price?.product?.price, domain.fullDomainData.prices.reseller_price?.product?.currency)}
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="text-sm text-green-700 dark:text-green-300 mb-1">Your Price</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatPrice(domain.fullDomainData.prices.reseller_price?.reseller?.price, domain.fullDomainData.prices.reseller_price?.reseller?.currency)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promotion Details - If Available */}
                  {domain.fullDomainData.prices.reseller_price.promotion_details && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                          <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-yellow-900 dark:text-yellow-100">Special Promotion</h3>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">Limited time offer</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Valid From</div>
                          <div className="font-medium text-yellow-900 dark:text-yellow-100">
                            {new Date(domain.fullDomainData.prices.reseller_price.promotion_details.start_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Valid Until</div>
                          <div className="font-medium text-yellow-900 dark:text-yellow-100">
                            {new Date(domain.fullDomainData.prices.reseller_price.promotion_details.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Regular Price (After Promotion)</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Retail</div>
                            <div className="font-medium">{formatPrice(domain.fullDomainData.prices.reseller_price?.promotion_details?.non_promo_price?.product?.price, domain.fullDomainData.prices.reseller_price?.promotion_details?.non_promo_price?.product?.currency)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Reseller</div>
                            <div className="font-medium text-green-600">{formatPrice(domain.fullDomainData.prices.reseller_price?.promotion_details?.non_promo_price?.reseller?.price, domain.fullDomainData.prices.reseller_price?.promotion_details?.non_promo_price?.reseller?.currency)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other Pricing - Clean Table Layout */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Additional Pricing</h3>

                    <div className="bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Service</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Retail Price</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Renewal</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(domain.fullDomainData.prices.renew_price?.product?.price, domain.fullDomainData.prices.renew_price?.product?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">
                                {formatPrice(domain.fullDomainData.prices.renew_price?.reseller?.price, domain.fullDomainData.prices.renew_price?.reseller?.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Transfer</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(domain.fullDomainData.prices.transfer_price?.product?.price, domain.fullDomainData.prices.transfer_price?.product?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">
                                {formatPrice(domain.fullDomainData.prices.transfer_price?.reseller?.price, domain.fullDomainData.prices.transfer_price?.reseller?.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Restore</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(domain.fullDomainData.prices.restore_price?.product?.price, domain.fullDomainData.prices.restore_price?.product?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">
                                {formatPrice(domain.fullDomainData.prices.restore_price?.reseller?.price, domain.fullDomainData.prices.restore_price?.reseller?.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Soft Restore</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(domain.fullDomainData.prices.soft_restore_price?.product?.price, domain.fullDomainData.prices.soft_restore_price?.product?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">
                                {formatPrice(domain.fullDomainData.prices.soft_restore_price?.reseller?.price, domain.fullDomainData.prices.soft_restore_price?.reseller?.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Setup</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(domain.fullDomainData.prices.setup_price?.product?.price, domain.fullDomainData.prices.setup_price?.product?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">
                                {formatPrice(domain.fullDomainData.prices.setup_price?.reseller?.price, domain.fullDomainData.prices.setup_price?.reseller?.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Domicile</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(domain.fullDomainData.prices.domicile_price?.product?.price, domain.fullDomainData.prices.domicile_price?.product?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">
                                {formatPrice(domain.fullDomainData.prices.domicile_price?.reseller?.price, domain.fullDomainData.prices.domicile_price?.reseller?.currency)}
                              </td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Settings className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">Update</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(domain.fullDomainData.prices.update_price?.product?.price, domain.fullDomainData.prices.update_price?.product?.currency)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-green-600">
                                {formatPrice(domain.fullDomainData.prices.update_price?.reseller?.price, domain.fullDomainData.prices.update_price?.reseller?.currency)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pricing information available</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 mt-8 max-h-[60vh] overflow-y-auto pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Domain Settings</CardTitle>
                  <CardDescription>Configure domain preferences and restrictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select defaultValue={domain.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="popularity">Popularity</Label>
                      <Select defaultValue={domain.popularity}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="minPeriod">Min Period (years)</Label>
                      <Input id="minPeriod" defaultValue={domain.minPeriod.toString()} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPeriod">Max Period (years)</Label>
                      <Input id="maxPeriod" defaultValue={domain.maxPeriod.toString()} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {domain.restrictions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Restrictions</CardTitle>
                    <CardDescription>Domain-specific limitations and requirements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {domain.restrictions.map((restriction, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Info className="h-3 w-3 mr-1" />
                          {restriction}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* <SheetFooter className="px-8">
          <div className="flex gap-4">
            <Button className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </div>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
}

