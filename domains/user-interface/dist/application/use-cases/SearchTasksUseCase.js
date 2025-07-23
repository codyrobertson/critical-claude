/**
 * Search Tasks Use Case
 * Implements fuzzy search functionality for tasks
 */
export class SearchTasksUseCase {
    taskRepository;
    logger;
    static DEFAULT_LIMIT = 20;
    static MAX_LIMIT = 100;
    constructor(taskRepository, logger) {
        this.taskRepository = taskRepository;
        this.logger = logger;
    }
    async execute(request) {
        this.logger.info('Executing SearchTasksUseCase', { request });
        try {
            const { query, limit = SearchTasksUseCase.DEFAULT_LIMIT } = request;
            if (!query || query.trim().length === 0) {
                return {
                    tasks: [],
                    query,
                    totalFound: 0
                };
            }
            const effectiveLimit = Math.min(limit, SearchTasksUseCase.MAX_LIMIT);
            const tasks = await this.taskRepository.search(query, effectiveLimit);
            this.logger.debug('Search completed', {
                query,
                found: tasks.length,
                limit: effectiveLimit
            });
            return {
                tasks,
                query,
                totalFound: tasks.length
            };
        }
        catch (error) {
            this.logger.error('Failed to search tasks', error, { request });
            throw error;
        }
    }
}
//# sourceMappingURL=SearchTasksUseCase.js.map