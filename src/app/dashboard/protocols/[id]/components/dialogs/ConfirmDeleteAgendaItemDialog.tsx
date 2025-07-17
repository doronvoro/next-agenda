import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteAgendaItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  agendaItemTitle?: string;
}

export function ConfirmDeleteAgendaItemDialog({
  open,
  onOpenChange,
  onConfirm,
  agendaItemTitle,
}: ConfirmDeleteAgendaItemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-right rtl">מחק סעיף מסדר היום</AlertDialogTitle>
          <AlertDialogDescription className="text-right rtl">
            {`האם אתה בטוח שברצונך למחוק${agendaItemTitle ? ` "${agendaItemTitle}"` : ""}? פעולה זו אינה ניתנת לביטול.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            מחק
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 