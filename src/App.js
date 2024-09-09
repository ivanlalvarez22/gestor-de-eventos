import "./App.css";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect } from "react";

function App() {
  const [start, setStart] = useState(new Date());
  const [end, setEnd] = useState(new Date());
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false); // Estado de carga

  const session = useSession();
  const supabase = useSupabaseClient();
  const { isLoading } = useSessionContext();

  useEffect(() => {
    if (!session) return;

    const pingAuthSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error al hacer ping a la sesión:", error);
        } else {
          console.log("Ping de sesión exitoso:", data);
        }
      } catch (err) {
        console.error("Error en la solicitud del ping de sesión:", err);
      }
    };

    pingAuthSession();
    const interval = setInterval(() => {
      pingAuthSession();
    }, 86400000); // 86400000 ms = 1 día

    return () => clearInterval(interval);
  }, [session, supabase]);

  if (isLoading || loading) {
    return <div className="loading">Cargando...</div>; // Mensaje de carga
  }

  async function googleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar",
      },
    });
    setLoading(false);
    if (error) {
      alert("Error iniciando sesión con Google en Supabase");
      console.log(error);
    }
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  }

  async function createCalendarEvent() {
    if (!eventName || !eventDescription || !location || !start || !end) {
      alert("Por favor, complete todos los campos antes de crear el evento.");
      return;
    }

    setLoading(true);
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

    const calendarId = "ivanlalvarez.22@gmail.com";

    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + session.provider_token,
          "Content-Type": "application/json",
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
      })
      .finally(() => setLoading(false)); // Asegura que se desactive el estado de carga
  }

  return (
    <div className="App">
      <div className="card">
        {session ? (
          <>
            <div>
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
                <button className="btn primary" onClick={createCalendarEvent}>
                  Crear evento en el calendario
                </button>
                <button className="btn secondary" onClick={signOut}>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </>
        ) : (
          <button className="btn primary" onClick={googleSignIn}>
            Iniciar Sesión con Google
          </button>
        )}
      </div>
      {session && (
        <div className="googleCalendar">
          <iframe
            src="https://calendar.google.com/calendar/embed?src=ivanlalvarez.22%40gmail.com&ctz=America%2FArgentina%2FBuenos_Aires"
            frameBorder="0"
            title="Google Calendar"
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default App;
