// AlertDialog is Dialog with `role="alertdialog"` — the role makes the dialog
// undismissable by an outside tap (WAI-ARIA: the user must pick an explicit
// action), so only the root needs a wrapper. Everything else is a name alias
// over the Dialog primitives.
export {
  type AlertDialogRootEmits,
  type AlertDialogRootProps,
  default as AlertDialogRoot,
} from './AlertDialogRoot.vue'

export {
  DialogClose as AlertDialogAction,
  type DialogCloseEmits as AlertDialogActionEmits,
  type DialogCloseProps as AlertDialogActionProps,
  DialogClose as AlertDialogCancel,
  type DialogCloseProps as AlertDialogCancelProps,
  DialogContent as AlertDialogContent,
  DialogContentImpl as AlertDialogContentImpl,
  type DialogContentImplProps as AlertDialogContentImplProps,
  DialogContentModal as AlertDialogContentModal,
  type DialogContentProps as AlertDialogContentProps,
  DialogDescription as AlertDialogDescription,
  type DialogDescriptionProps as AlertDialogDescriptionProps,
  DialogOverlay as AlertDialogOverlay,
  DialogOverlayImpl as AlertDialogOverlayImpl,
  type DialogOverlayImplProps as AlertDialogOverlayImplProps,
  type DialogOverlayProps as AlertDialogOverlayProps,
  DialogPortal as AlertDialogPortal,
  type DialogPortalProps as AlertDialogPortalProps,
  DialogTitle as AlertDialogTitle,
  type DialogTitleProps as AlertDialogTitleProps,
  DialogTrigger as AlertDialogTrigger,
  type DialogTriggerProps as AlertDialogTriggerProps,
  injectDialogRootContext as injectAlertDialogRootContext,
} from '@/components/Dialog'
