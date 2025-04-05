
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Loader2, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Report } from "@/lib/supabase";

export function AdminReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchReports();
  }, []);
  
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Fetch reports with joined data
      const { data, error } = await supabase.from('reports')
        .select(`
          id, item_id, reporter_id, reason, status, created_at,
          items:item_id (id, title, category),
          profiles:reporter_id (id, name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Format data to match the Report type
      const formattedReports = data.map(report => ({
        ...report,
        item: report.items,
        reporter: report.profiles
      }));
      
      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      // Use PostgreSQL function to update report status
      const { error } = await supabase.rpc('update_report_status', {
        p_report_id: reportId,
        p_status: newStatus
      });
      
      if (error) throw error;
      
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status: newStatus } : report
      ));
      
      toast({
        title: "Success",
        description: `Report marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteItem = async (itemId: string, reportId: string) => {
    try {
      setLoading(true);
      
      // First mark the report as reviewed
      const { error: updateError } = await supabase.rpc('update_report_status', {
        p_report_id: reportId,
        p_status: 'reviewed'
      });
      
      if (updateError) throw updateError;
      
      // Then delete the item
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (deleteError) throw deleteError;
      
      // Update the reports list
      setReports(reports.map(report => 
        report.id === reportId ? { ...report, status: 'reviewed' } : report
      ));
      
      toast({
        title: "Success",
        description: "Reported item has been deleted",
      });
    } catch (error) {
      console.error('Error handling report:', error);
      toast({
        title: "Error",
        description: "Failed to process the report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reported Item</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No reports found
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.item?.title || 'Unknown Item'}
                      {report.item?.category && (
                        <Badge variant={report.item.category === 'Lost' ? "destructive" : "default"} className="ml-2">
                          {report.item.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{report.reason}</div>
                    </TableCell>
                    <TableCell>{report.reporter?.name || 'Unknown User'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        report.status === 'pending' ? "outline" : 
                        report.status === 'reviewed' ? "secondary" : 
                        "default"
                      }>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/items/${report.item_id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="default"
                          size="icon"
                          onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                          disabled={report.status !== 'pending'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteItem(report.item_id, report.id)}
                          disabled={report.status !== 'pending'}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
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
