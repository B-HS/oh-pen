import { Plugin, usePlugin } from '@opencode/plugin/tui'
import { For, Show } from 'solid-js'
import { readLatestPenStatus } from './opencode-plugin-status.ts'

const STATUS_LABEL = {
    pending: 'PENDING',
    in_progress: 'ACTIVE',
    completed: 'DONE',
    cancelled: 'CANCELLED',
} as const

const PenStatusPanel = (props: { sessionID: string }) => {
    const context = usePlugin()
    const status = () => readLatestPenStatus(context.data.session.message.list(props.sessionID))

    return (
        <Show when={status()}>
            <box flexDirection="column" marginTop={1}>
                <text fg={context.theme.text.muted}>GOAL</text>
                <text fg={context.theme.text.base}>{status()?.goal}</text>
                <text fg={context.theme.text.muted} marginTop={1}>
                    TODO
                </text>
                <For each={status()?.todos ?? []}>
                    {(todo) => (
                        <text fg={todo.status === 'in_progress' ? context.theme.accent.base : context.theme.text.muted}>
                            {STATUS_LABEL[todo.status]} {todo.content}
                        </text>
                    )}
                </For>
            </box>
        </Show>
    )
}

export default Plugin.define({
    id: 'oh-pencode.status-tui',
    setup: (context) =>
        context.ui.slot({
            append: 'sidebar.content',
            render: ({ sessionID }) => <PenStatusPanel sessionID={sessionID} />,
        }),
})
