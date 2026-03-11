import { useState, useEffect } from 'react'

export function useTomatoList() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetch('https://hlong200.github.io/wolf-peach/tomatoes.json')
        .then(res => res.json())
        .then(data => setData(data))
        .catch(err => {setError(err);console.log(err)})
        .finally(() => setLoading(false))
    }, [])

    return { data, loading, error }
}

export function useTomato(id) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!id) return

        fetch(`https://hlong200.github.io/wolf-peach/types/${id}.json`)
        .then(res => res.json())
        .then(data => setData(data))
        .catch(err => setError(err))
        .finally(() => setLoading(false))
    }, [id])

    return { data, loading, error }
}

export function useAttributions(id) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!id) return

        fetch(`https://hlong200.github.io/wolf-peach/attributions.json`)
        .then(res => res.json())
        .then(data => setData(data.filter()))
    })
}