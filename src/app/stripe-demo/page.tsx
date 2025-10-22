import { PricingTable } from "@/components/stripe/PricingTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function StripeDemoPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">🔄 TEMPORARY - Stripe Demo</h1>
        <p className="text-lg text-muted-foreground mb-4">
          This is a demo page to test the Stripe integration.
        </p>
        <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
          ⚠️ Delete this entire /stripe-demo directory after testing
        </p>
        <div className="mt-4">
          <Link href="/stripe-demo/admin">
            <Button variant="outline" size="sm">
              View Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <PricingTable />
    </div>
  );
}