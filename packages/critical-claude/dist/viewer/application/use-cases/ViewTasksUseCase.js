/**
 * View Tasks Use Case
 * Implements the business logic for viewing and filtering tasks
 */
export class ViewTasksUseCase {
    taskRepository;
    eventBus;
    logger;
    constructor(taskRepository, eventBus, logger) {
        this.taskRepository = taskRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async execute(request) {
        this.logger.info('Executing ViewTasksUseCase', { request });
        try {
            const { filter, sort, page = 1, pageSize = 50 } = request;
            const result = await this.taskRepository.findAll(filter, sort, { page, pageSize });
            await this.eventBus.publish({
                type: 'TasksViewed',
                aggregateId: 'system',
                timestamp: new Date(),
                payload: {
                    filter,
                    sort,
                    count: result.items.length
                }
            });
            return {
                tasks: result.items,
                total: result.total,
                page: result.page,
                pageSize: result.pageSize,
                totalPages: result.totalPages
            };
        }
        catch (error) {
            this.logger.error('Failed to view tasks', error, { request });
            throw error;
        }
    }
}
//# sourceMappingURL=ViewTasksUseCase.js.map