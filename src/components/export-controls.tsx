import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "~/components/ui/dropdown-menu";

interface ExportControlsProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export function ExportControls({
  onExportCSV,
  onExportExcel,
  onPrint
}: ExportControlsProps) {
  const handleExport = async (
    action: () => void | Promise<void>,
    format: string
  ) => {
    try {
      await action();
      toast.success(`${format} exported successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast.error(message);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Download options">
          <Download size={16} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleExport(onExportExcel, "Excel")}
          >
            <FileSpreadsheet size={14} aria-hidden="true" />
            Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport(onExportCSV, "CSV")}>
            <FileText size={14} aria-hidden="true" />
            CSV (.csv)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={() => {
          try {
            onPrint();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Print failed";
            toast.error(message);
          }
        }}
        aria-label="Print or save as PDF"
        className="text-slate hover:text-charcoal rounded-lg p-1.5 transition-colors"
      >
        <Printer size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
