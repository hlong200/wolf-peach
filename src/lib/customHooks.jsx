import { useState, useEffect } from 'react';

export function useVegetableList() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${import.meta.env.BASE_URL}data/vegetables.json`)
        .then(res => res.json())
        .then(data => setData(data))
        .catch(err => {setError(err);console.log(err)})
        .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}

export function useVegetable(culinaryType, id) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!culinaryType || !id) return;

        fetch(`https://hlong200.github.io/wolf-peach/data/${culinaryType}/${id}.json`)
        .then(res => res.json())
        .then(data => setData(data))
        .catch(err => setError(err))
        .finally(() => setLoading(false));
    }, [culinaryType, id])

    return { data, loading, error };
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

export function useColumnCount() {
    const getCount = () => {
        if (window.innerWidth >= 1400) return 4;
        if (window.innerWidth >= 992)  return 3;
        return 2;
    };
    const [count, setCount] = useState(getCount);
    useEffect(() => {
        const handler = () => setCount(getCount());
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return count;
}

export function useIsMobile() {
    const check = () =>
        window.matchMedia('(max-width: 575px)').matches ||
        window.matchMedia('(pointer: coarse)').matches;

    const [isMobile, setIsMobile] = useState(check);
    useEffect(() => {
        setIsMobile(check());
        const handler = () => setIsMobile(check());
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}