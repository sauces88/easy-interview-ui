// 定义接口类型
export namespace IBot {
    export interface Query {
        limit?: number
        page?: number
        identifier?: string
        [key: string]: any
    }

    export interface Row {
        bot_id: string
        bot_name: string
        description?: string
        icon_url?: string
        publish_time?: number
    }

    // 新增详情接口类型
    export interface Detail {
        name: string
        description: string
        version: string
        bot_id: string
        icon_url: string
        create_time: number
        update_time: number
        prompt_info: {
            prompt: string
        }
        onboarding_info: {
            prologue: string
            suggestedQuestions: string
        }
        bot_mode: number
        model_info: {
            temperature: number
            topP: string
            model_id: string
            model_name: string
            frequency_penalty: string
            presence_penalty: string
            context_round: number
            max_tokens: number
        }
        plugin_info_list: any[]
        workflow_info_list: Array<{
            id: string
            name: string
            description: string
            icon_url: string
        }>
        shortcut_commands: any[]
    }
}
