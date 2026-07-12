# Scaffolding script — hrms-app
# Usage: pnpm scaffold <type> <name>
# Types: model, page, feature, email

param(
    [Parameter(Position=0)]
    [ValidateSet("model", "page", "feature", "email")]
    [string]$Type,

    [Parameter(Position=1)]
    [string]$Name,

    [switch]$Force
)

function New-Model {
    param([string]$Name)
    $schemaPath = "packages/db/src/schema/$Name.ts"
    $validatorPath = "packages/validators/src/$Name.ts"
    $routerPath = "apps/web/trpc/routers/$Name.ts"

    if ((Test-Path $schemaPath) -and -not $Force) {
        Write-Error "Model '$Name' already exists. Use -Force to overwrite."
        return
    }

    $schemaContent = @"
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const ${Name} = pgTable("${Name}", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});
"@
    Set-Content -Path $schemaPath -Value $schemaContent

    $validatorContent = @"
import { z } from "zod";

export const create${Name}Schema = z.object({
  name: z.string().min(1),
});

export const update${Name}Schema = create${Name}Schema.partial();

export type Create${Name}Input = z.infer<typeof create${Name}Schema>;
export type Update${Name}Input = z.infer<typeof update${Name}Schema>;
"@
    Set-Content -Path $validatorPath -Value $validatorContent

    $routerContent = @"
import { createTRPCRouter, protectedProcedure } from "../server";
import { db, schema } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { create${Name}Schema, update${Name}Schema } from "@hrms-app/validators";

export const ${Name}Router = createTRPCRouter({
  list: protectedProcedure.query(async () => {
    return await db.select().from(schema.${Name}).orderBy(schema.${Name}.createdAt);
  }),

  getById: protectedProcedure.input(z.string().uuid()).query(async ({ input }) => {
    const result = await db.select().from(schema.${Name}).where(eq(schema.${Name}.id, input)).limit(1);
    return result[0];
  }),

  create: protectedProcedure.input(create${Name}Schema).mutation(async ({ input }) => {
    const result = await db.insert(schema.${Name}).values(input).returning();
    return result[0];
  }),

  update: protectedProcedure.input(z.object({
    id: z.string().uuid(),
    data: update${Name}Schema,
  })).mutation(async ({ input }) => {
    const result = await db.update(schema.${Name}).set(input.data).where(eq(schema.${Name}.id, input.id)).returning();
    return result[0];
  }),

  delete: protectedProcedure.input(z.string().uuid()).mutation(async ({ input }) => {
    await db.delete(schema.${Name}).where(eq(schema.${Name}.id, input));
    return { success: true };
  }),
});
"@
    Set-Content -Path $routerPath -Value $routerContent

    Write-Host "Created model '$Name':" -ForegroundColor Green
    Write-Host "  - $schemaPath"
    Write-Host "  - $validatorPath"
    Write-Host "  - $routerPath"
    Write-Host "Don't forget to:" -ForegroundColor Yellow
    Write-Host "  1. Add your columns to the schema"
    Write-Host "  2. Add the router to apps/web/trpc/index.ts"
    Write-Host "  3. Run pnpm db:push or pnpm db:generate"
}

function New-Page {
    param([string]$Name)
    $pageDir = "apps/web/app/(dashboard)/$Name"
    New-Item -ItemType Directory -Path $pageDir -Force | Out-Null

    $pageContent = @"
import { api } from "~/trpc/react";

export default function ${Name}Page() {
  const { data } = api.${Name}.list.useQuery();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">${Name}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
"@
    Set-Content -Path "$pageDir/page.tsx" -Value $pageContent

    $errorContent = @"
"use client";

export default function ${Name}Error({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  );
}
"@
    Set-Content -Path "$pageDir/error.tsx" -Value $errorContent

    $loadingContent = @"
export default function ${Name}Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
"@
    Set-Content -Path "$pageDir/loading.tsx" -Value $loadingContent

    Write-Host "Created page '$Name':" -ForegroundColor Green
    Write-Host "  - $pageDir/page.tsx"
    Write-Host "  - $pageDir/error.tsx"
    Write-Host "  - $pageDir/loading.tsx"
}

switch ($Type) {
    "model" { New-Model $Name }
    "page"  { New-Page $Name }
    "feature" {
        Write-Host "Generating full feature: $Name" -ForegroundColor Cyan
        New-Model $Name
        New-Page $Name
        Write-Host "Feature '$Name' created." -ForegroundColor Green
    }
    "email" {
        $emailPath = "packages/email/src/templates/$Name.tsx"
        $emailContent = @"
import { Html, Body, Container, Text, Button, Head } from "@react-email/components";

interface ${Name}EmailProps {
  // Add your props here
}

export function ${Name}Email({}: ${Name}EmailProps) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Hello,</Text>
          <Button href="https://hrms-app.com">Click me</Button>
        </Container>
      </Body>
    </Html>
  );
}

export default ${Name}Email;
"@
        Set-Content -Path $emailPath -Value $emailContent
        Write-Host "Created email template '$Name' at $emailPath" -ForegroundColor Green
    }
}
