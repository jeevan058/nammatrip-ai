
import { useEffect } from 'react'

export function FounderPage() {
    useEffect(() => {
        document.title = 'Jeevan KT — Founder & Developer of NammaTrip AI'

        const description =
            'Meet Jeevan KT, founder and developer of NammaTrip AI, an AI-powered travel planner for Karnataka.'

        let metaDescription = document.querySelector(
            'meta[name="description"]',
        ) as HTMLMetaElement | null

        if (!metaDescription) {
            metaDescription = document.createElement('meta')
            metaDescription.name = 'description'
            document.head.appendChild(metaDescription)
        }

        metaDescription.content = description

        let canonical = document.querySelector(
            'link[rel="canonical"]',
        ) as HTMLLinkElement | null

        if (!canonical) {
            canonical = document.createElement('link')
            canonical.rel = 'canonical'
            document.head.appendChild(canonical)
        }

        canonical.href = 'https://nammatrip-ai.vercel.app/founder'

        const schema = {
            '@context': 'https://schema.org',
            '@type': 'ProfilePage',
            name: 'Jeevan KT — Founder & Developer of NammaTrip AI',
            url: 'https://nammatrip-ai.vercel.app/founder',
            mainEntity: {
                '@type': 'Person',
                name: 'Jeevan KT',
                jobTitle: 'Founder & Developer',
                description,
                url: 'https://nammatrip-ai.vercel.app/founder',
                sameAs: [
                    'https://github.com/jeevan058/nammatrip-ai',
                ],
                affiliation: {
                    '@type': 'Organization',
                    name: 'NammaTrip AI',
                    url: 'https://nammatrip-ai.vercel.app/',
                },
            },
        }

        let script = document.getElementById(
            'founder-profile-schema',
        ) as HTMLScriptElement | null

        if (!script) {
            script = document.createElement('script')
            script.id = 'founder-profile-schema'
            script.type = 'application/ld+json'
            document.head.appendChild(script)
        }

        script.textContent = JSON.stringify(schema)

        return () => {
            document.getElementById('founder-profile-schema')?.remove()
        }
    }, [])

    return (
        <main
            style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '64px 24px',
                fontFamily: 'Arial, sans-serif',
                lineHeight: 1.7,
                color: '#20352b',
            }}
        >
            <a href="/" style={{ color: '#286347' }}>
                ← Back to NammaTrip AI
            </a>

            <p style={{ marginTop: '48px', color: '#286347', fontWeight: 600 }}>
                MEET THE FOUNDER
            </p>

            <h1>Jeevan KT</h1>

            <h2>Founder &amp; Developer of NammaTrip AI</h2>

            <p>
                Jeevan KT is the founder and developer of NammaTrip AI, an AI-powered
                travel planner built to help people explore Karnataka.
            </p>

            <p>
                NammaTrip AI helps travellers plan personalised trips based on their
                budget, travel duration, and interests. The platform supports
                trip planning in English and Kannada.
            </p>

            <h2>About the Project</h2>

            <p>
                NammaTrip AI brings together itinerary generation, estimated budgets,
                destination discovery, and route exploration to make planning a
                Karnataka trip easier.
            </p>

            <p>
                <a href="https://nammatrip-ai.vercel.app/">
                    Explore NammaTrip AI
                </a>
            </p>

            <p>
                <a href="https://github.com/jeevan058/nammatrip-ai">
                    View NammaTrip AI on GitHub
                </a>
            </p>
        </main>
    )
}
