"use client";

import { captureEvent } from "@/lib/posthog";

import * as React from "react";
import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { LAST_REQ_DT, unwrapKraData, unwrapKraList } from "./agency.kra-etims/_lib/etims-kra";

export default function ETimsSettingsPage() {
    const utils = trpc.useUtils();

    const { data: configStatus, isLoading: isLoadingConfig } = trpc.etims.auth.getConfiguration.useQuery();

    const initMutation = trpc.etims.initialization.initializeDevice.useMutation({
        onSuccess: () => {
            captureEvent("etims_connected");
            toast.success(
                configStatus?.isInitialized
                    ? "eTIMS re-initialized"
                    : "eTIMS initialized",
            );
            utils.etims.auth.getConfiguration.invalidate();
        },
        onError: (error) => {
            toast.error(`Initialization failed: ${error.message}`);
        },
    });

    const [formData, setFormData] = React.useState({
        kraPin: "",
        branchId: "00",
        deviceSerialNumber: "",
        isSandbox: true,
    });

    React.useEffect(() => {
        if (configStatus?.config) {
            setFormData({
                kraPin: configStatus.config.kraPin,
                branchId: configStatus.config.branchId,
                deviceSerialNumber: configStatus.config.deviceSerialNumber,
                isSandbox: configStatus.config.isSandbox,
            });
        }
    }, [configStatus]);

    const isInitialized = Boolean(configStatus?.isInitialized);
    const canEdit = !isInitialized || formData.isSandbox;

    const { data: taxpayerData, isFetching: isFetchingTaxpayer } =
        trpc.etims.data.getTaxPayerInfo.useQuery(
            { lastReqDt: LAST_REQ_DT },
            { enabled: isInitialized },
        );

    const taxpayer = React.useMemo(() => {
        const data = unwrapKraData(taxpayerData);
        const list = unwrapKraList(taxpayerData, "infoList", "taxpayerList", "taxPayerList", "itemList");
        return list[0] ?? data;
    }, [taxpayerData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const onHandleInitialize = () => {
        initMutation.mutate({
            tin: formData.kraPin,
            bhfId: formData.branchId,
            dvcSrlNo: formData.deviceSerialNumber,
            isSandbox: formData.isSandbox,
        });
    };

    const location = [taxpayer.locDesc, taxpayer.sctrNm, taxpayer.dstrtNm, taxpayer.prvncNm]
        .filter(Boolean)
        .map(String)
        .join(", ");

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-3xl mx-auto">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-base font-semibold tracking-tight">eTIMS</h1>
                    <Badge variant={isInitialized ? "outline" : "secondary"}>
                        {isInitialized ? (
                            <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                                Initialized
                            </span>
                        ) : (
                            "Not initialized"
                        )}
                    </Badge>
                </div>

                {isLoadingConfig ? (
                    <div className="flex justify-center py-12">
                        <Spinner size={32} />
                    </div>
                ) : (
                    <Card className="mt-6 bg-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Taxpayer details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isInitialized ? (
                                isFetchingTaxpayer && !taxpayer.taxprNm && !taxpayer.tin ? (
                                    <div className="flex justify-center py-6">
                                        <Spinner size={24} />
                                    </div>
                                ) : (
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Legal name</dt>
                                            <dd className="mt-0.5 font-medium">{String(taxpayer.taxprNm ?? "—")}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">PIN</dt>
                                            <dd className="mt-0.5 font-mono">{String(taxpayer.tin ?? formData.kraPin ?? "—")}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Branch</dt>
                                            <dd className="mt-0.5 font-mono">{formData.branchId || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-muted-foreground">Status</dt>
                                            <dd className="mt-0.5">{String(taxpayer.taxprSttsCd ?? "—")}</dd>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <dt className="text-xs text-muted-foreground">Location</dt>
                                            <dd className="mt-0.5">{location || "—"}</dd>
                                        </div>
                                    </dl>
                                )
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="kraPin">KRA PIN</Label>
                                            <Input
                                                id="kraPin"
                                                value={formData.kraPin}
                                                onChange={handleInputChange}
                                                placeholder="P05XXXXXXXX"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="branchId">Branch ID</Label>
                                            <Input
                                                id="branchId"
                                                value={formData.branchId}
                                                onChange={handleInputChange}
                                                placeholder="00"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="deviceSerialNumber">Device serial</Label>
                                        <Input
                                            id="deviceSerialNumber"
                                            value={formData.deviceSerialNumber}
                                            onChange={handleInputChange}
                                            placeholder="NPCXXXXXXX"
                                            disabled={!canEdit}
                                        />
                                    </div>
                                    <Button
                                        onClick={onHandleInitialize}
                                        disabled={initMutation.isPending || !formData.kraPin || !formData.deviceSerialNumber}
                                    >
                                        {initMutation.isPending && <Spinner size={16} className="mr-2" />}
                                        {initMutation.isPending ? "Initializing…" : "Initialize device"}
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
