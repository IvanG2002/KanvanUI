import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash } from "react-icons/fi";
import { motion } from "framer-motion";
import { FaFire } from "react-icons/fa";
import JSConfetti from "js-confetti";
import Swal from 'sweetalert2';



export const CustomKanban = () => {
    return (
        <div className="h-screen w-full bg-neutral-100 text-neutral-600">
            <Navbar></Navbar>
            <Board />
        </div>
    );
};




const Navbar = () => {
    return (
        <div className="h-12 w-full bg-white flex justify-center flex-col p-2 sticky">
            <h1 className="text-neutral-600 text-2xl">Kan<span className="text-blue-500">van</span>📋</h1>
        </div>
    )
}

const Board = () => {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const response = await fetch("http://localhost:3000/tasks");
                const data = await response.json();
                setCards(data);
                console.log(data)
            } catch (error) {
                console.error('Error fetching cards:', error);
            }
        };
        fetchCards();
    }, []);

    return (
        <div className="flex h-auto w-full gap-3 p-12">
            <Column
                title="Backlog 🎉"
                column="backlog"
                headingColor="text-neutral-500"
                cards={cards}
                setCards={setCards}
            />
            <Column
                title="TODO ⏳"
                column="todo"
                headingColor="text-neutral-500"
                cards={cards}
                setCards={setCards}
            />
            <Column
                title="In progress 🔄"
                column="doing"
                headingColor="text-neutral-500"
                cards={cards}
                setCards={setCards}
            />
            <Column
                title="Complete ✅"
                column="done"
                headingColor="text-neutral-500"
                cards={cards}
                setCards={setCards}
            />
            <BurnBarrel setCards={setCards} />
        </div>
    );
};

const Column = ({ title, headingColor, cards, column, setCards }) => {
    const [active, setActive] = useState(false);
    const jsConfetti = new JSConfetti();
    const handleDragStart = (e, card) => {
        e.dataTransfer.setData("cardId", card.id);
    };

    const handleDragEnd = (e) => {
        const cardId = e.dataTransfer.getData("cardId");

        setActive(false);
        clearHighlights();

        const indicators = getIndicators();
        const { element } = getNearestIndicator(e, indicators);

        const before = element.dataset.before || "-1";

        if (before !== cardId) {
            let copy = [...cards];

            let cardToTransfer = copy.find((c) => c.id === cardId);
            if (!cardToTransfer) return;
            cardToTransfer = { ...cardToTransfer, column };

            copy = copy.filter((c) => c.id !== cardId);

            const moveToBack = before === "-1";

            if (moveToBack) {
                copy.push(cardToTransfer);
            } else {
                const insertAtIndex = copy.findIndex((el) => el.id === before);
                if (insertAtIndex === undefined) return;

                copy.splice(insertAtIndex, 0, cardToTransfer);
            }

            setCards(copy);
        }
        if (column === "done") {
            jsConfetti.addConfetti();
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        highlightIndicator(e);

        setActive(true);
    };

    const clearHighlights = (els) => {
        const indicators = els || getIndicators();

        indicators.forEach((i) => {
            i.style.opacity = "0";
        });
    };

    const highlightIndicator = (e) => {
        const indicators = getIndicators();

        clearHighlights(indicators);

        const el = getNearestIndicator(e, indicators);

        el.element.style.opacity = "1";
    };

    const getNearestIndicator = (e, indicators) => {
        const DISTANCE_OFFSET = 50;

        const el = indicators.reduce(
            (closest, child) => {
                const box = child.getBoundingClientRect();

                const offset = e.clientY - (box.top + DISTANCE_OFFSET);

                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            },
            {
                offset: Number.NEGATIVE_INFINITY,
                element: indicators[indicators.length - 1],
            }
        );

        return el;
    };

    const getIndicators = () => {
        return Array.from(document.querySelectorAll(`[data-column="${column}"]`));
    };

    const handleDragLeave = () => {
        clearHighlights();
        setActive(false);
    };

    const filteredCards = cards.filter((c) => c.column === column);
    return (
        <div className="w-56 shrink-0">
            <div className="mb-3 flex items-center justify-between">
                <h3 className={`font-medium ${headingColor}`}>{title}</h3>
                <span className="rounded text-sm text-neutral-400">
                    {filteredCards.length}
                </span>
            </div>
            <div
                onDrop={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`h-full w-full transition-colors ${active ? "bg-neutral-300/50" : "bg-neutral-300/0"
                    }`}
            >
                {filteredCards.map((c) => {
                    return <Card key={c.id} {...c} handleDragStart={handleDragStart} />;
                })}
                <DropIndicator beforeId={null} column={column} />
                <AddCard column={column} setCards={setCards} />
            </div>
        </div>
    );
};

const Card = ({ title, id, column, info, handleDragStart }) => {
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);
    return (
        <>
            <DropIndicator beforeId={id} column={column} />
            {isLoading ? (
                <div className="animate-pulse rounded border border-neutral-300 bg-white p-3">
                    <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded"></div>
                </div>
            ) : (
                <motion.div
                    layout
                    layoutId={id}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, { title, id, column })}
                    className="cursor-grab rounded border border-neutral-300 bg-white p-3 active:cursor-grabbing"
                >
                    <h1 className="text-lg text-neutral-500 font-bold">{title}</h1>
                    <p className="text-sm text-neutral-700">{info}</p>
                </motion.div>
            )}
        </>
    );
};

const DropIndicator = ({ beforeId, column }) => {
    return (
        <div
            data-before={beforeId || "-1"}
            data-column={column}
            className="my-0.5 h-0.5 w-full bg-neutral-400 opacity-0"
        />
    );
};

const BurnBarrel = ({ setCards }) => {
    const [active, setActive] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setActive(true);
    };

    const handleDragLeave = () => {
        setActive(false);
    };

    const handleDragEnd = async (e) => {
        const cardId = e.dataTransfer.getData("cardId");

        try {
            const response = await fetch(`http://localhost:3000/tasks/${cardId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la tarjeta');
            }

            setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));
            setActive(false);
            Swal.fire({
                title: "Task deleted 💀💀💀",
                width: 600,
                padding: "3em",
                color: "#716add",
                background: "#fff url(/images/trees.png)",
                backdrop: `
                  rgba(0,0,123,0.4)
                  url("/images/delete.gif")
                  left top
                  no-repeat
                `
            });


        } catch (error) {
            console.error('Error al eliminar la tarjeta:', error.message);
        }
    };


    return (
        <div
            onDrop={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`mt-10 grid h-56 w-56 shrink-0 place-content-center rounded border text-3xl ${active
                ? "border-red-800 bg-red-800/20 text-red-500"
                : "border-neutral-500 bg-neutral-500/20 text-neutral-500"
                }`}
        >
            {active ? <FaFire className="animate-bounce" /> : <FiTrash />}
        </div>
    );
};

const AddCard = ({ column, setCards }) => {
    const [text, setText] = useState("");
    const [title, setTitle] = useState("");
    const [adding, setAdding] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!text.trim().length) return;
        if (!title.trim().length) return;

        const newCard = {
            column,
            title: title.trim(),
            info: text.trim(),
            id: Math.random().toString(),
        };

        try {
            const response = await fetch("http://localhost:3000/tasks", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newCard)
            });

            if (!response.ok) {
                throw new Error('Error al agregar la tarjeta');
            }
            const result = await response.json();
            setCards((pv) => [...pv, result]);

            Swal.fire({
                title: "Task created 📌📌📌",
                width: 600,
                padding: "3em",
                color: "#716add",
                background: "#fff url(/images/trees.png)",
                backdrop: `
                  rgba(0,0,123,0.4)
                  url("/images/cat.gif")
                  left top
                  no-repeat
                `
            });

        } catch (error) {
            console.error('Error:', error);
        }
        setAdding(false);
    };

    return (
        <>
            {adding ? (
                <motion.form layout onSubmit={handleSubmit}>
                    <input
                        type="text"
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Add new title..."
                        className="w-full rounded border border-blue-600 bg-blue-400/20 p-3 text-sm text-neutral-700 placeholder-blue-300 focus:outline-0 placeholder:text-blue-500 mb-2"
                    />
                    <textarea
                        onChange={(e) => setText(e.target.value)}
                        autoFocus
                        placeholder="Add new task..."
                        className="w-full rounded border border-blue-600 bg-blue-400/20 p-3 text-sm text-neutral-700 placeholder-blue-300 focus:outline-0 resize-none placeholder:text-blue-500"
                    />
                    <div className="mt-1.5 flex items-center justify-end gap-1.5">
                        <button
                            onClick={() => setAdding(false)}
                            className="px-3 py-1.5 text-xs text-neutral-500 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-1.5 rounded bg-blue-500 px-3 py-1.5 text-xs text-white transition-colors hover:bg-blue-400"
                        >
                            <span>Add</span>
                            <FiPlus />
                        </button>
                    </div>
                </motion.form>
            ) : (
                <motion.button
                    layout
                    onClick={() => setAdding(true)}
                    className="flex w-full items-center border-dashed border p-5 justify-around"
                >
                    <span>Add card</span>
                    <FiPlus />
                </motion.button>
            )}
        </>
    );
};

