<script lang="ts">
	import ToolCard from '$lib/components/ToolCard.svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';

	let { data } = $props();

	// Sample projects for demonstration (shown when not authenticated)
	const sampleProjects = [
		{
			name: 'Farmhouse Dining Table',
			type: 'Table',
			progress: 75,
			lastUpdated: '2024-01-20',
			thumbnailIcon: 'table'
		},
		{
			name: 'Shop Cabinet',
			type: 'Cabinet',
			progress: 30,
			lastUpdated: '2024-01-18',
			thumbnailIcon: 'cabinet'
		},
		{
			name: 'Floating Bookshelf',
			type: 'Bookshelf',
			progress: 100,
			lastUpdated: '2024-01-10',
			thumbnailIcon: 'bookshelf'
		}
	];

	// Format date for display
	function formatDate(date: Date): string {
		return date.toISOString().split('T')[0];
	}
</script>

<svelte:head>
	<title>WoodShop Toolbox</title>
	<meta name="description" content="Personal woodworking tools platform - BOM Generator and more" />
</svelte:head>

<div class="dashboard animate-fade-in">
	<!-- Hero Section -->
	<section class="hero-section">
		<div class="hero-content">
			<span class="hero-eyebrow">Digital Workshop</span>
			<h1 class="hero-title">Plan your builds with precision</h1>
			<p class="hero-description">
				Professional-grade tools for woodworkers. Create detailed bills of materials,
				optimize cuts, and calculate wood movement — all in one place.
			</p>
		</div>

		<!-- Decorative Illustration -->
		<div class="hero-illustration">
			<div class="illustration-placeholder" style="width: 100%; height: 200px;">
				<div class="workshop-sketch">
					<svg viewBox="0 0 200 120" fill="none" stroke="currentColor" stroke-width="0.75">
						<!-- Workbench outline -->
						<rect x="20" y="40" width="160" height="60" rx="2" opacity="0.3" />
						<line x1="20" y1="55" x2="180" y2="55" stroke-dasharray="4 2" opacity="0.2" />

						<!-- Tools on bench -->
						<rect x="30" y="48" width="20" height="4" rx="1" opacity="0.5" />
						<rect x="60" y="46" width="8" height="8" rx="1" opacity="0.5" />
						<path d="M80 50 L100 48 L100 52 L80 54 Z" opacity="0.4" />

						<!-- Saw blade decoration -->
						<circle cx="150" cy="65" r="20" opacity="0.15" />
						<circle cx="150" cy="65" r="15" stroke-dasharray="2 2" opacity="0.2" />
						<circle cx="150" cy="65" r="3" fill="currentColor" opacity="0.3" />

						<!-- Wood grain lines -->
						<line x1="25" y1="70" x2="70" y2="70" opacity="0.15" />
						<line x1="25" y1="75" x2="75" y2="75" opacity="0.1" />
						<line x1="25" y1="80" x2="65" y2="80" opacity="0.15" />
						<line x1="25" y1="85" x2="70" y2="85" opacity="0.1" />
					</svg>
					<span>The Digital Workshop</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Editorial Grid Layout -->
	<div class="editorial-grid">
		<!-- Active Projects Section -->
		<section class="projects-section span-7">
			<div class="section-header">
				<h2 class="section-title">{data.isAuthenticated ? 'My Projects' : 'Active Builds'}</h2>
				{#if data.isAuthenticated}
					<a href="/projects" class="section-action btn-ghost">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="action-icon">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						New Project
					</a>
				{:else}
					<a href="/bom/new" class="section-action btn-ghost">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="action-icon">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						New Project
					</a>
				{/if}
			</div>

			<div class="projects-grid stagger-children">
				{#if data.isAuthenticated}
					{#if data.projects.length > 0}
						{#each data.projects as project}
							<ProjectCard
								name={project.name}
								type="Project"
								progress={0}
								lastUpdated={formatDate(project.updatedAt)}
								thumbnailIcon="project"
								href="/projects/{project.id}"
							/>
						{/each}
					{:else}
						<!-- Empty state for authenticated users with no projects -->
						<div class="empty-state sanded-surface">
							<p>You haven't created any projects yet.</p>
							<a href="/projects" class="btn-primary">Create Your First Project</a>
						</div>
					{/if}
				{:else}
					{#each sampleProjects as project}
						<ProjectCard
							name={project.name}
							type={project.type}
							progress={project.progress}
							lastUpdated={project.lastUpdated}
							thumbnailIcon={project.thumbnailIcon}
						/>
					{/each}
				{/if}

				<!-- Start New Build Card -->
				<a href={data.isAuthenticated ? '/projects' : '/bom/new'} class="new-project-card sanded-surface">
					<div class="new-project-icon">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
					</div>
					<span class="new-project-label">Start New Build</span>
				</a>
			</div>
		</section>

		<!-- Tools Section -->
		<section class="tools-section span-5">
			<div class="section-header">
				<h2 class="section-title">Tools</h2>
			</div>

			<div class="tools-list stagger-children">
				<ToolCard
					title="BOM Generator"
					description="Create detailed bills of materials through a guided workflow with AI assistance."
					href="/bom/new"
					icon="clipboard"
				/>

				<ToolCard
					title="Cut List Optimizer"
					description="Optimize your cuts to minimize waste and maximize material efficiency."
					href="/cutlist"
					icon="scissors"
				/>
			</div>
		</section>
	</div>

	<!-- Joinery Reference Section -->
	<section class="joinery-section">
		<div class="section-header">
			<h2 class="section-title">Joinery Reference</h2>
			<span class="section-subtitle">Common techniques at a glance</span>
		</div>

		<div class="joinery-grid stagger-children">
			<div class="joinery-card joinery-schematic">
				<div class="joinery-illustration">
					<svg viewBox="0 0 60 40" fill="none" stroke="currentColor" stroke-width="0.5">
						<!-- Dovetail -->
						<path d="M5 5 L15 5 L12 20 L18 20 L15 35 L5 35 Z" opacity="0.6" />
						<path d="M55 5 L45 5 L48 20 L42 20 L45 35 L55 35 Z" opacity="0.6" />
						<path d="M15 8 L45 8" stroke-dasharray="2 2" opacity="0.3" />
						<path d="M18 20 L42 20" stroke-dasharray="2 2" opacity="0.3" />
						<path d="M15 32 L45 32" stroke-dasharray="2 2" opacity="0.3" />
					</svg>
				</div>
				<span class="joinery-name">Dovetail</span>
			</div>

			<div class="joinery-card joinery-schematic">
				<div class="joinery-illustration">
					<svg viewBox="0 0 60 40" fill="none" stroke="currentColor" stroke-width="0.5">
						<!-- Mortise & Tenon -->
						<rect x="5" y="10" width="20" height="20" opacity="0.6" />
						<rect x="12" y="15" width="6" height="10" fill="currentColor" opacity="0.2" />
						<rect x="35" y="5" width="20" height="30" opacity="0.6" />
						<rect x="25" y="15" width="10" height="10" opacity="0.4" />
					</svg>
				</div>
				<span class="joinery-name">Mortise & Tenon</span>
			</div>

			<div class="joinery-card joinery-schematic">
				<div class="joinery-illustration">
					<svg viewBox="0 0 60 40" fill="none" stroke="currentColor" stroke-width="0.5">
						<!-- Box Joint -->
						<path d="M5 5 L15 5 L15 12 L22 12 L22 5 L30 5 L30 35 L5 35 Z" opacity="0.6" />
						<path d="M30 5 L30 12 L37 12 L37 5 L45 5 L45 12 L55 12 L55 35 L30 35 Z" opacity="0.6" />
					</svg>
				</div>
				<span class="joinery-name">Box Joint</span>
			</div>

			<div class="joinery-card joinery-schematic">
				<div class="joinery-illustration">
					<svg viewBox="0 0 60 40" fill="none" stroke="currentColor" stroke-width="0.5">
						<!-- Dado -->
						<rect x="5" y="15" width="50" height="10" opacity="0.3" />
						<rect x="20" y="5" width="20" height="30" opacity="0.6" />
						<line x1="20" y1="15" x2="40" y2="15" stroke-dasharray="2 2" opacity="0.5" />
						<line x1="20" y1="25" x2="40" y2="25" stroke-dasharray="2 2" opacity="0.5" />
					</svg>
				</div>
				<span class="joinery-name">Dado</span>
			</div>
		</div>
	</section>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--space-2xl);
	}

	/* Hero Section */
	.hero-section {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-xl);
		align-items: center;
	}

	@media (min-width: 1024px) {
		.hero-section {
			grid-template-columns: 1fr 1fr;
		}
	}

	.hero-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.hero-eyebrow {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-walnut);
	}

	.hero-title {
		font-family: var(--font-display);
		font-size: clamp(2rem, 5vw, 3rem);
		line-height: 1.1;
		color: var(--color-ink);
		margin: 0;
	}

	.hero-description {
		font-size: 1.0625rem;
		color: var(--color-ink-muted);
		line-height: 1.6;
		margin: 0;
		max-width: 480px;
	}

	.hero-illustration {
		display: none;
	}

	@media (min-width: 1024px) {
		.hero-illustration {
			display: block;
		}
	}

	.workshop-sketch {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: var(--space-md);
	}

	.workshop-sketch svg {
		width: 100%;
		max-width: 200px;
		height: auto;
		color: var(--color-walnut);
	}

	.workshop-sketch span {
		font-family: var(--font-display);
		font-size: 0.875rem;
		font-style: italic;
		color: var(--color-walnut);
		opacity: 0.7;
	}

	/* Section Headers */
	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.section-title {
		font-family: var(--font-display);
		font-size: 1.5rem;
		color: var(--color-ink);
		margin: 0;
	}

	.section-subtitle {
		font-size: 0.875rem;
		color: var(--color-ink-muted);
	}

	.section-action {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: 0.875rem;
		text-decoration: none;
	}

	.action-icon {
		width: 18px;
		height: 18px;
	}

	/* Projects Section */
	.projects-section {
		grid-column: span 12;
	}

	@media (min-width: 1024px) {
		.projects-section {
			grid-column: span 7;
		}
	}

	.projects-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-md);
	}

	@media (min-width: 640px) {
		.projects-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* New Project Card */
	.new-project-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-xl);
		border: 2px dashed rgba(93, 64, 55, 0.3);
		border-radius: var(--radius-lg);
		text-decoration: none;
		color: var(--color-walnut);
		transition: all var(--transition-base);
		min-height: 140px;
	}

	.new-project-card:hover {
		border-color: var(--color-walnut);
		background: rgba(93, 64, 55, 0.04);
	}

	.new-project-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		background: var(--color-paper-dark);
	}

	.new-project-icon svg {
		width: 20px;
		height: 20px;
	}

	.new-project-label {
		font-weight: 500;
		font-size: 0.9375rem;
	}

	/* Tools Section */
	.tools-section {
		grid-column: span 12;
	}

	@media (min-width: 1024px) {
		.tools-section {
			grid-column: span 5;
		}
	}

	.tools-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	/* Joinery Reference */
	.joinery-section {
		padding-top: var(--space-lg);
		border-top: 1px solid rgba(17, 17, 17, 0.08);
	}

	.joinery-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-md);
	}

	@media (min-width: 640px) {
		.joinery-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	.joinery-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-lg);
	}

	.joinery-illustration {
		width: 80px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.joinery-illustration svg {
		width: 100%;
		height: 100%;
		color: var(--color-walnut);
	}

	.joinery-name {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-ink-soft);
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-2xl);
		text-align: center;
		grid-column: span 2;
	}

	.empty-state p {
		margin: 0;
		color: var(--color-ink-muted);
		font-size: 1rem;
	}

	.empty-state .btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-walnut);
		color: white;
		border-radius: var(--radius-md);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9375rem;
		transition: background var(--transition-base);
	}

	.empty-state .btn-primary:hover {
		background: var(--color-walnut-dark);
	}
</style>
