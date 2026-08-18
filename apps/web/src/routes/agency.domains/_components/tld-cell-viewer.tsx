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

import type { TldData } from "./schema";

interface TldCellViewerProps {
  tld: TldData;
  children?: React.ReactNode;
}

export function TldCellViewer({ tld, children }: TldCellViewerProps) {

  // Helper function to format prices safely
  const formatPrice = (price: number | undefined, currency: string | undefined) => {
    if (price === undefined || currency === undefined) {
      return 'N/A';
    }
    return `${currency} ${price.toFixed(2)}`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button variant="link" className="text-foreground w-fit px-0 text-left">
            {tld.name}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="mb-6 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle>{tld.name}</SheetTitle>
              <SheetDescription>
                Top Level Domain Extension
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
                      <div className={`p-1 rounded-full ${tld.status === 'ACT' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {tld.status === 'ACT' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      </div>
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={tld.status === 'ACT' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {tld.status}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Transfer</span>
                        <Badge variant={tld.transfer_available ? 'default' : 'secondary'}>
                          {tld.transfer_available ? 'Available' : 'Not Available'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Renewal</span>
                        <Badge variant={tld.renew_available ? 'default' : 'secondary'}>
                          {tld.renew_available ? 'Available' : 'Not Available'}
                        </Badge>
                      </div>
                    </div>
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
                        <div className={`p-1 rounded ${(tld.supported_idn_scripts?.length || 0) > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Globe className="h-4 w-4" />
                        </div>
                        <span className="text-sm">IDN Support</span>
                        {(tld.supported_idn_scripts?.length || 0) > 0 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${tld.dnssec_allowed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Shield className="h-4 w-4" />
                        </div>
                        <span className="text-sm">DNSSEC</span>
                        {tld.dnssec_allowed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${tld.is_transfer_auth_code_required ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Lock className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Auth Code Required</span>
                        {tld.is_transfer_auth_code_required ? <CheckCircle className="h-4 w-4 text-orange-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded ${tld.is_private_whois_allowed ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          <Star className="h-4 w-4" />
                        </div>
                        <span className="text-sm">Private Whois</span>
                        {tld.is_private_whois_allowed ? <CheckCircle className="h-4 w-4 text-blue-600" /> : <XCircle className="h-4 w-4 text-gray-400" />}
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
                      <div className="text-2xl font-bold text-primary">{tld.min_period}</div>
                      <div className="text-sm text-muted-foreground">Min Years</div>
                    </div>
                    <div className="text-muted-foreground">to</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{tld.max_period}</div>
                      <div className="text-sm text-muted-foreground">Max Years</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* IDN Scripts */}
              {(tld.supported_idn_scripts?.length || 0) > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Supported IDN Scripts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {tld.supported_idn_scripts?.map((script, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {script.description} ({script.value})
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6 mt-8 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-6">
                {/* Main Reseller Price - Hero Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Registration Pricing</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Current wholesale pricing</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Retail Price</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(tld.prices?.reseller_price?.product?.price, tld.prices?.reseller_price?.product?.currency)}
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <div className="text-sm text-green-700 dark:text-green-300 mb-1">Your Price</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPrice(tld.prices?.reseller_price?.reseller?.price, tld.prices?.reseller_price?.reseller?.currency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promotion Details - If Available */}
                {tld.prices?.reseller_price?.promotion_details && (
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
                          {new Date(tld.prices?.reseller_price?.promotion_details?.start_date || '').toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Valid Until</div>
                        <div className="font-medium text-yellow-900 dark:text-yellow-100">
                          {new Date(tld.prices?.reseller_price?.promotion_details?.end_date || '').toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Regular Price (After Promotion)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Retail</div>
                          <div className="font-medium">{formatPrice(tld.prices.reseller_price?.promotion_details?.non_promo_price?.product?.price, tld.prices.reseller_price?.promotion_details?.non_promo_price?.product?.currency)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Reseller</div>
                          <div className="font-medium text-green-600">{formatPrice(tld.prices.reseller_price?.promotion_details?.non_promo_price?.reseller?.price, tld.prices.reseller_price?.promotion_details?.non_promo_price?.reseller?.currency)}</div>
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
                              {formatPrice(tld.prices?.renew_price?.product?.price, tld.prices?.renew_price?.product?.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {formatPrice(tld.prices?.renew_price?.reseller?.price, tld.prices?.renew_price?.reseller?.currency)}
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
                              {formatPrice(tld.prices?.transfer_price?.product?.price, tld.prices?.transfer_price?.product?.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {formatPrice(tld.prices?.transfer_price?.reseller?.price, tld.prices?.transfer_price?.reseller?.currency)}
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
                              {formatPrice(tld.prices?.restore_price?.product?.price, tld.prices?.restore_price?.product?.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {formatPrice(tld.prices?.restore_price?.reseller?.price, tld.prices?.restore_price?.reseller?.currency)}
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
                              {formatPrice(tld.prices?.soft_restore_price?.product?.price, tld.prices?.soft_restore_price?.product?.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {formatPrice(tld.prices?.soft_restore_price?.reseller?.price, tld.prices?.soft_restore_price?.reseller?.currency)}
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
                              {formatPrice(tld.prices?.setup_price?.product?.price, tld.prices?.setup_price?.product?.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {formatPrice(tld.prices?.setup_price?.reseller?.price, tld.prices?.setup_price?.reseller?.currency)}
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
                              {formatPrice(tld.prices?.domicile_price?.product?.price, tld.prices?.domicile_price?.product?.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {formatPrice(tld.prices?.domicile_price?.reseller?.price, tld.prices?.domicile_price?.reseller?.currency)}
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
                              {formatPrice(tld.prices?.update_price?.product?.price, tld.prices?.update_price?.product?.currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-green-600">
                              {formatPrice(tld.prices?.update_price?.reseller?.price, tld.prices?.update_price?.reseller?.currency)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 mt-8 max-h-[60vh] overflow-y-auto pr-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">TLD Settings</CardTitle>
                  <CardDescription>Configure TLD preferences and restrictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select defaultValue={tld.status}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACT">Active</SelectItem>
                          <SelectItem value="INACT">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transfer">Transfer Available</Label>
                      <Select defaultValue={tld.transfer_available.toString()}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="minPeriod">Min Period (years)</Label>
                      <Input id="minPeriod" defaultValue={tld.min_period.toString()} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPeriod">Max Period (years)</Label>
                      <Input id="maxPeriod" defaultValue={tld.max_period.toString()} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quarantine Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quarantine Information</CardTitle>
                  <CardDescription>Domain quarantine periods and policies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{tld.soft_quarantine_period}</div>
                      <div className="text-sm text-muted-foreground">Soft Quarantine (days)</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{tld.quarantine_period}</div>
                      <div className="text-sm text-muted-foreground">Quarantine (days)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
