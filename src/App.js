import "./App.css";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState } from "react";

function App() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [location, setLocation] = useState("");

  const session = useSession(); // tokens
  console.log(session);
  const supabase = useSupabaseClient(); // talk to supabase!
  const { isLoading } = useSessionContext();

  if (isLoading) {
    return <></>;
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar",
      },
    });
    if (error) {
      alert("Error loggin in to Google provider with Supabase");
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function createCalendarEvent() {
    // Validar que todos los campos estén llenos
    if (!eventName || !eventDescription || !location || !start || !end) {
      alert("Por favor, complete todos los campos antes de crear el evento.");
      return;
    }

    console.log("Creando evento en el calendario");
    const event = {
      summary: eventName,
      description: eventDescription,
      location: location,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + session.provider_token,
        },
        body: JSON.stringify(event),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        alert("Evento creado, revise su Google Calendar");
      })
      .catch((error) => {
        console.error("Error al crear el evento:", error);
        alert("Hubo un error al crear el evento. Por favor, intente de nuevo.");
      });
  }

  return (
    <div className="App">
      <div className="card">
        {session ? (
          <>
            <h2 className="title">
              Hola{" "}
              <code style={{ color: "red", fontFamily: "Arial" }}>
                {session.user.email}
              </code>
            </h2>
            <div className="input-group">
              <label>Inicio de su evento</label>
              <DatePicker
                selected={start}
                onChange={(date) => setStart(date)}
                showTimeSelect
                dateFormat="dd/MM/yyyy, p"
                className="input"
              />
            </div>
            <div className="input-group">
              <label>Finalización de su evento</label>
              <DatePicker
                selected={end}
                onChange={(date) => setEnd(date)}
                showTimeSelect
                dateFormat="dd/MM/yyyy, p"
                className="input"
              />
            </div>
            <div className="input-group">
              <label>Nombre del evento</label>
              <input
                type="text"
                onChange={(e) => setEventName(e.target.value)}
                value={eventName}
                className="input"
                placeholder="Ingresa el nombre del evento"
              />
            </div>
            <div className="input-group">
              <label>Descripción del evento</label>
              <input
                type="text"
                onChange={(e) => setEventDescription(e.target.value)}
                value={eventDescription}
                className="input"
                placeholder="Ingresa la descripción del evento"
              />
            </div>
            <div className="input-group">
              <label>Ubicación del evento</label>
              <input
                type="text"
                onChange={(e) => setLocation(e.target.value)}
                value={location}
                className="input"
                placeholder="Ingresa la ubicación del evento"
              />
            </div>
            <div className="buttons">
              <button
                className="btn primary"
                onClick={() => createCalendarEvent()}
              >
                Crear evento en el calendario
              </button>
              <button className="btn secondary" onClick={() => signOut()}>
                Cerrar Sesión
              </button>
            </div>
          </>
        ) : (
          <button className="btn primary" onClick={() => googleSignIn()}>
            Iniciar Sesión con Google
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
