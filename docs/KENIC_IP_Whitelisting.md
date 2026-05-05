# KENIC IP Whitelisting — Google Cloud Run Egress

## Background

Our backend server is deployed on **Google Cloud Run**. Cloud Run does not assign a static
outbound (egress) IP address by default — it draws from a pool of IPs managed by Google,
meaning the IP our server appears to come from can change at any time without notice.

This became a problem when whitelisting our server on KENIC (Kenya Network Information Centre),
because every time the IP rotated we had to manually look it up and add it again. To solve
this permanently, we whitelisted the entire **CIDR ranges** that cover Google Cloud Run's
egress IPs for our region, instead of individual IPs.

---

## What We Observed

Over several days, the outbound IPs from our Cloud Run service followed a clear pattern:

| Date | IP Address |
|---|---|
| May 5, 2026, 11:04 AM | 34.96.49.44 |
| May 5, 2026, 8:44 AM | 34.34.225.220 |
| May 1, 2026, 5:41 PM | 34.96.49.96 |
| Apr 29, 2026, 10:49 AM | 34.34.225.69 |

All observed IPs fell within two Google Cloud CIDR blocks:

- `34.96.0.0/14` — covers `34.96.0.0` to `34.99.255.255`
- `34.34.0.0/16` — covers `34.34.0.0` to `34.34.255.255`

---

## What We Did

Instead of whitelisting individual IPs, we whitelisted the two CIDR ranges above on KENIC.

### The CIDR Input Fix

The KENIC whitelist form has a **Network** option with two separate input boxes:

```
[ IP Address ]  /  [ Mask Number ]
```

The mistake initially made was entering the full CIDR notation (e.g. `34.96.0.0/14`) into
the left box alone, which caused the error:

> *"The cidr mask must be a number"*

The correct way to enter it is to **split the CIDR at the slash**:

| Left box (IP) | `/` | Right box (mask only) |
|---|---|---|
| `34.96.0.0` | `/` | `14` |
| `34.34.0.0` | `/` | `16` |

Each network is added separately using the **ADD** button, and after both are added, click
**SAVE**.

---

## Why CIDR Instead of Individual IPs

| Approach | Pros | Cons |
|---|---|---|
| Whitelist single IPs | Precise | Breaks every time IP rotates |
| Whitelist CIDR ranges | Covers all IPs in the block | Slightly broader than one IP |
| Whitelist all Google Cloud IPs | Most complete | Hundreds of ranges, too broad |
| Cloud NAT with static IP | Guaranteed single IP forever | Requires GCP infrastructure change |

Since we are **not switching regions**, whitelisting the two CIDR ranges is a safe and
practical long-term approach. Google typically draws egress IPs from the same regional
pool, so these ranges should remain stable.

---

## Future Consideration — `cloud.json`

Google publicly publishes all of its Cloud IP ranges in a JSON file:

```
https://www.gstatic.com/ipranges/cloud.json
```

### What It Contains

The file lists every IP prefix Google Cloud uses globally, along with the service and
region each prefix belongs to. A sample entry looks like this:

```json
{
  "ipv4Prefix": "34.96.0.0/14",
  "service": "Google Cloud",
  "scope": "europe-west1"
}
```

### How It Can Help

If our Cloud Run service ever starts using an IP outside the two ranges we whitelisted
(which would be rare but possible), this file is the definitive source to look up which
new CIDR block to add.

You can also use it programmatically — for example, a script that:

1. Fetches `cloud.json`
2. Filters entries by region (e.g. `europe-west`)
3. Returns all CIDR blocks for that region
4. Alerts you if a new block appears that is not yet whitelisted

### Quick Manual Lookup

To check which CIDR block a new mystery IP belongs to:

1. Open `https://www.gstatic.com/ipranges/cloud.json` in a browser
2. Search (`Ctrl+F`) for the first two octets of the IP (e.g. `34.96`)
3. Find the matching `ipv4Prefix` entry
4. Note the `scope` to confirm it matches your Cloud Run region

---

## Summary

- We whitelisted **two CIDR ranges** on KENIC to cover all current and likely future
  egress IPs from our Google Cloud Run service.
- The KENIC form requires the IP and mask to be entered in **separate fields**, not as
  a combined CIDR string.
- Google's `cloud.json` file is the official reference if we ever need to expand or
  verify our whitelisted ranges in the future.
- The permanent fix, if ever needed, is to configure **Cloud NAT with a reserved static
  IP** — this would give us one fixed IP to whitelist forever.
