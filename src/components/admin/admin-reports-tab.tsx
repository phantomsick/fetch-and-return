
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Report } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export function AdminReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          items:item_id (
            id,
            title,
            category
          ),
          profiles:reporter_id (
            id,
            name,
            email,
            profile_picture,
            role,
            banned
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const formattedReports: Report[] = data.map(report => ({
        ...report,
        item: report.items,
        reporter: report.profiles
      }));

      setReports(formattedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error fetching reports",
        description: "Could not load reports. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReportAction = async (reportId: string, action: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: action })
        .eq("id", reportId);

      if (error) {
        throw error;
      }

      // Update the reports list
      setReports(
        reports.map((report) =>
          report.id === reportId ? { ...report, status: action } : report
        )
      );

      toast({
        title: "Report updated",
        description: `The report has been marked as ${action}.`,
      });
    } catch (error) {
      console.error("Error updating report:", error);
      toast({
        title: "Error updating report",
        description: "Failed to update the report status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItemAndResolveReport = async (reportId: string, itemId: string) => {
    try {
      // First delete the item
      const { error: itemError } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (itemError) {
        throw itemError;
      }

      // Then mark the report as resolved
      const { error: reportError } = await supabase
        .from("reports")
        .update({ status: "resolved" })
        .eq("id", reportId);

      if (reportError) {
        throw reportError;
      }

      // Update the reports list to remove this report (or mark it resolved)
      setReports(reports.filter((report) => report.id !== reportId));

      toast({
        title: "Item removed",
        description: "The item has been deleted and the report resolved.",
      });
    } catch (error) {
      console.error("Error handling report:", error);
      toast({
        title: "Error processing report",
        description: "Failed to process the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "resolved":
        return "bg-green-500 hover:bg-green-600";
      case "dismissed":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Reports Management</h3>
        <Button variant="outline" onClick={fetchReports} disabled={loading}>
          Refresh List
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No reports found.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.item ? (
                        <>
                          {report.item.title}
                          <Badge className="ml-2" variant="outline">
                            {report.item.category}
                          </Badge>
                        </>
                      ) : (
                        "Deleted Item"
                      )}
                    </TableCell>
                    <TableCell>
                      {report.reporter?.name || "Anonymous"}
                      {report.reporter?.email && (
                        <div className="text-xs text-muted-foreground">
                          {report.reporter.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{report.reason}</div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(report.status)}
                        variant="default"
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {report.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleReportAction(report.id, "resolved")
                            }
                            className="text-green-500"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Resolve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleReportAction(report.id, "dismissed")
                            }
                            className="text-amber-500"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Dismiss
                          </Button>
                          {report.item && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Item
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Reported Item
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this item? This
                                    action cannot be undone. The report will be
                                    automatically marked as resolved.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteItemAndResolveReport(
                                        report.id,
                                        report.item_id
                                      )
                                    }
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
