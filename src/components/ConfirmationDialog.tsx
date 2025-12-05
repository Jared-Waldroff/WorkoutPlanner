import React from 'react';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';

interface ConfirmationDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
}

export default function ConfirmationDialog({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
}: ConfirmationDialogProps) {
    const theme = useTheme();

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onCancel} style={{ backgroundColor: theme.colors.surface, borderRadius: 12 }}>
                <Dialog.Title style={{ color: theme.colors.onSurface }}>{title}</Dialog.Title>
                <Dialog.Content>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                        {message}
                    </Text>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onCancel} textColor={theme.colors.secondary}>
                        {cancelLabel}
                    </Button>
                    <Button onPress={onConfirm} textColor={isDestructive ? theme.colors.error : theme.colors.primary}>
                        {confirmLabel}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}
