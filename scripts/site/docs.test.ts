import { describe, expect, test } from 'bun:test'
import { docPages, renderDoc } from './docs.ts'
import { notFoundPage } from './pages.ts'

describe('배포 문서 경로', () => {
    test('설계와 설치 문서의 실행 안내를 발행된 HTML로 연결한다', async () => {
        const sources = docPages.filter((page) => ['architecture', 'installer'].includes(page.slug))
        expect(sources.length).toBe(2)
        for (const source of sources) {
            const rendered = await renderDoc(source)
            expect(rendered.html).toContain('href="runtime.html"')
            expect(rendered.html).not.toContain('href="runtime.md"')
        }
    })
    test('중첩된 없는 경로에서도 404의 홈·문서·스타일 경로가 사이트 루트로 연결된다', () => {
        const html = notFoundPage()
        const baseHref = html.match(/<base href="([^"]+)"/)?.[1]
        expect(baseHref).toBe('/oh-pen/')
        const base = new URL(baseHref ?? '', 'https://b-hs.github.io/oh-pen/docs/missing/page')
        expect(new URL('index.html', base).pathname).toBe('/oh-pen/index.html')
        expect(new URL('docs/index.html', base).pathname).toBe('/oh-pen/docs/index.html')
        expect(new URL('site.css', base).pathname).toBe('/oh-pen/site.css')
    })
})
