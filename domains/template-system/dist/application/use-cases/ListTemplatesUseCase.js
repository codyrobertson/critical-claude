/**
 * List Templates Use Case
 * Application service for retrieving and filtering templates
 */
export class ListTemplatesUseCase {
    templateRepository;
    constructor(templateRepository) {
        this.templateRepository = templateRepository;
    }
    async execute(request = {}) {
        try {
            let templates;
            switch (request.category) {
                case 'builtin':
                    templates = await this.templateRepository.findBuiltIn();
                    break;
                case 'user':
                    templates = await this.templateRepository.findUserCreated();
                    break;
                case 'all':
                default:
                    templates = await this.templateRepository.findAll();
                    break;
            }
            // Filter by tag if specified
            if (request.tag) {
                templates = templates.filter(template => template.metadata.tags && template.metadata.tags.includes(request.tag));
            }
            // Get counts for summary
            const [builtIn, user] = await Promise.all([
                this.templateRepository.findBuiltIn(),
                this.templateRepository.findUserCreated()
            ]);
            return {
                success: true,
                data: templates,
                builtInCount: builtIn.length,
                userCount: user.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
}
//# sourceMappingURL=ListTemplatesUseCase.js.map